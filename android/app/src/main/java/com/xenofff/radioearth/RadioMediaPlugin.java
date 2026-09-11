package com.xenofff.radioearth;

import android.content.Context;
import android.content.Intent;
import androidx.core.content.ContextCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "RadioMedia")
public class RadioMediaPlugin extends Plugin {

    @PluginMethod
    public void startForeground(PluginCall call) {
        String title = call.getString("title", "Radio Earth");
        String artist = call.getString("artist", "Playing Live");

        Context context = getContext();
        Intent serviceIntent = new Intent(context, RadioForegroundService.class);
        serviceIntent.setAction(RadioForegroundService.ACTION_START);
        serviceIntent.putExtra(RadioForegroundService.EXTRA_TITLE, title);
        serviceIntent.putExtra(RadioForegroundService.EXTRA_ARTIST, artist);

        try {
            ContextCompat.startForegroundService(context, serviceIntent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to start foreground service: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void stopForeground(PluginCall call) {
        Context context = getContext();
        Intent serviceIntent = new Intent(context, RadioForegroundService.class);
        serviceIntent.setAction(RadioForegroundService.ACTION_STOP);

        try {
            context.startService(serviceIntent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to stop foreground service: " + e.getMessage(), e);
        }
    }
}
