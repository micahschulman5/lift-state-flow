import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Bell, 
  BellOff,
  Clock,
  Info,
  Scale,
  Ruler
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Layout } from '@/components/Layout';
import { NumberInput } from '@/components/NumberInput';
import { useSettings } from '@/hooks/useWorkoutData';
import { WeightUnit, DistanceUnit } from '@/types/workout';

export default function Settings() {
  const { settings, loading, updateSettings } = useSettings();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        updateSettings({ notificationsEnabled: true });
        
        // Show test notification
        new Notification('Notifications Enabled!', {
          body: 'You\'ll now receive rest timer alerts',
          icon: '/pwa-192x192.png',
        });
      }
    }
  };

  const testVibration = () => {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const testSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 200);
    } catch (err) {
      console.error('Sound test failed:', err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded-2xl" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 space-y-6 safe-top pb-24">
        {/* Header */}
        <div className="pt-2">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        
        {/* Default timers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 space-y-4"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Default Rest Timers</h2>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Rest between sets (seconds)
            </label>
            <NumberInput
              value={settings.defaultRestBetweenSets}
              onValueChange={(next) => updateSettings({ defaultRestBetweenSets: next })}
              min={0}
              className="tap-target"
            />
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Rest between exercises (seconds)
            </label>
            <NumberInput
              value={settings.defaultRestBetweenExercises}
              onValueChange={(next) => updateSettings({ defaultRestBetweenExercises: next })}
              min={0}
              className="tap-target"
            />
          </div>
        </motion.div>
        
        {/* Units */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-4 space-y-4"
        >
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Units</h2>
          </div>
          
          {/* Weight Unit */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Weight Unit</p>
                <p className="text-sm text-muted-foreground">Display weights in lbs or kgs</p>
              </div>
            </div>
            <div className="flex bg-muted rounded-lg p-1">
              <button
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  settings.weightUnit === 'lbs' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground'
                }`}
                onClick={() => updateSettings({ weightUnit: 'lbs' as WeightUnit })}
              >
                lbs
              </button>
              <button
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  settings.weightUnit === 'kgs' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground'
                }`}
                onClick={() => updateSettings({ weightUnit: 'kgs' as WeightUnit })}
              >
                kgs
              </button>
            </div>
          </div>
          
          {/* Distance Unit */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ruler className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Distance Unit</p>
                <p className="text-sm text-muted-foreground">For cardio exercises</p>
              </div>
            </div>
            <div className="flex bg-muted rounded-lg p-1">
              <button
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  settings.distanceUnit === 'miles' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground'
                }`}
                onClick={() => updateSettings({ distanceUnit: 'miles' as DistanceUnit })}
              >
                mi
              </button>
              <button
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  settings.distanceUnit === 'km' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground'
                }`}
                onClick={() => updateSettings({ distanceUnit: 'km' as DistanceUnit })}
              >
                km
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-4 space-y-4"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Notifications & Alerts</h2>
          </div>
          
          {/* Sound */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-muted-foreground" />
              ) : (
                <VolumeX className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Sound</p>
                <p className="text-sm text-muted-foreground">Play sound when rest ends</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {settings.soundEnabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={testSound}
                >
                  Test
                </Button>
              )}
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
              />
            </div>
          </div>
          
          {/* Vibration */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Vibrate className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Vibration</p>
                <p className="text-sm text-muted-foreground">Vibrate when rest ends</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {settings.vibrationEnabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={testVibration}
                >
                  Test
                </Button>
              )}
              <Switch
                checked={settings.vibrationEnabled}
                onCheckedChange={(checked) => updateSettings({ vibrationEnabled: checked })}
              />
            </div>
          </div>
          
          {/* Push notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.notificationsEnabled && notificationPermission === 'granted' ? (
                <Bell className="w-5 h-5 text-muted-foreground" />
              ) : (
                <BellOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  {notificationPermission === 'granted' 
                    ? 'Get notified when rest ends'
                    : notificationPermission === 'denied'
                    ? 'Notifications blocked in browser'
                    : 'Request permission for notifications'}
                </p>
              </div>
            </div>
            {notificationPermission === 'granted' ? (
              <Switch
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) => updateSettings({ notificationsEnabled: checked })}
              />
            ) : notificationPermission !== 'denied' ? (
              <Button
                size="sm"
                onClick={requestNotificationPermission}
              >
                Enable
              </Button>
            ) : null}
          </div>
        </motion.div>
        
        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-4 space-y-4"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">About</h2>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Flow State</strong> - Workout Tracker</p>
            <p>Version 1.0.0</p>
            <p>All data is stored locally on your device. No accounts, no cloud sync, no tracking.</p>
          </div>
          
          <div className="pt-2 border-t border-border text-sm text-muted-foreground">
            <p>To install as an app:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Open in Safari</li>
              <li>Tap the Share button</li>
              <li>Select "Add to Home Screen"</li>
            </ol>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
