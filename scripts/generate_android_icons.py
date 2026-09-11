import os
import math
import zlib
import struct

def make_png(width, height, get_pixel_fn):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel_fn(x, y)
            raw_data.extend([r, g, b, a])
    
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(bytes(raw_data), 9)) + chunk(b'IEND', b'')

# Colors
BG_COLOR = (11, 14, 20)      # #0B0E14
EMERALD_COLOR = (22, 198, 131) # #16C683

def sample_launcher_icon(px, py, size):
    cx = size / 2.0
    cy = size / 2.0
    d = math.hypot(px - cx, py - cy)
    r_max = size * 0.47
    
    if d > r_max:
        return (0, 0, 0, 0)
    
    # Proportions matching viewBox="0 0 100 100":
    # Outer radius 40 (d ~ 0.40 * size), stroke 8 (d: 36..44 -> 0.36..0.44 * size)
    # Inner dot radius 16 (d: 0..16 -> 0..0.16 * size)
    r_outer_start = size * 0.355
    r_outer_end = size * 0.445
    r_inner = size * 0.165
    
    if d <= r_inner:
        return (*EMERALD_COLOR, 255)
    elif r_outer_start <= d <= r_outer_end:
        return (*EMERALD_COLOR, 255)
    else:
        return (*BG_COLOR, 255)

def sample_foreground_icon(px, py, size):
    # In 108dp viewport, safe zone is circle radius 33dp (0.305 * size)
    cx = size / 2.0
    cy = size / 2.0
    d = math.hypot(px - cx, py - cy)
    
    # In 108dp viewport:
    # Outer ring: center 54, radius ~ 25 (stroke width ~ 5.2) -> range ~ 22.4 to 27.6 dp
    # Inner dot: center 54, radius ~ 10.2 dp
    r_inner = size * (10.5 / 108.0)
    r_outer_start = size * (22.5 / 108.0)
    r_outer_end = size * (28.2 / 108.0)
    
    if d <= r_inner:
        return (*EMERALD_COLOR, 255)
    elif r_outer_start <= d <= r_outer_end:
        return (*EMERALD_COLOR, 255)
    else:
        return (0, 0, 0, 0)

def render_antialiased(width, height, sampler):
    samples = 4
    step = 1.0 / samples
    half_step = step / 2.0
    
    def get_pixel(x, y):
        acc_r = acc_g = acc_b = acc_a = 0
        for sy in range(samples):
            for sx in range(samples):
                sub_x = x + sx * step + half_step
                sub_y = y + sy * step + half_step
                r, g, b, a = sampler(sub_x, sub_y, width)
                # Premultiply for correct alpha blending
                acc_r += r * (a / 255.0)
                acc_g += g * (a / 255.0)
                acc_b += b * (a / 255.0)
                acc_a += a
        
        total_samples = samples * samples
        avg_a = acc_a / total_samples
        if avg_a > 0.001:
            avg_r = (acc_r / total_samples) / (avg_a / 255.0)
            avg_g = (acc_g / total_samples) / (avg_a / 255.0)
            avg_b = (acc_b / total_samples) / (avg_a / 255.0)
            return (
                int(round(max(0, min(255, avg_r)))),
                int(round(max(0, min(255, avg_g)))),
                int(round(max(0, min(255, avg_b)))),
                int(round(max(0, min(255, avg_a))))
            )
        else:
            return (0, 0, 0, 0)
    
    return make_png(width, height, get_pixel)

base_res = os.path.abspath('android/app/src/main/res')

launcher_densities = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

foreground_densities = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432,
}

# 1. Generate ic_launcher.png & ic_launcher_round.png
for folder, size in launcher_densities.items():
    folder_path = os.path.join(base_res, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    png_data = render_antialiased(size, size, sample_launcher_icon)
    
    launcher_file = os.path.join(folder_path, 'ic_launcher.png')
    with open(launcher_file, 'wb') as f:
        f.write(png_data)
        
    round_file = os.path.join(folder_path, 'ic_launcher_round.png')
    with open(round_file, 'wb') as f:
        f.write(png_data)
        
    print(f"Generated {launcher_file} ({size}x{size})")

# 2. Generate ic_launcher_foreground.png
for folder, size in foreground_densities.items():
    folder_path = os.path.join(base_res, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    png_data = render_antialiased(size, size, sample_foreground_icon)
    
    fg_file = os.path.join(folder_path, 'ic_launcher_foreground.png')
    with open(fg_file, 'wb') as f:
        f.write(png_data)
        
    print(f"Generated {fg_file} ({size}x{size})")

print("All Android launcher icons generated successfully!")
