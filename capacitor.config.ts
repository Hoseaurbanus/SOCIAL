import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.smugflex.app',
  appName: 'SMUGFLEX',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
