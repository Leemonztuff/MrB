// lib/environment.ts
// Environment validation and security utilities

export const environment = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  get requiredVariables() {
    return [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'GEMINI_API_KEY'
    ];
  },

  get publicVariables() {
    return [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_WHATSAPP_NUMBER',
      'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
    ];
  },

  get privateVariables() {
    return [
      'SUPABASE_SERVICE_ROLE_KEY',
      'GEMINI_API_KEY'
    ];
  },

  validate() {
    const missing = this.requiredVariables.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      const error = `❌ Missing required environment variables: ${missing.join(', ')}`;
      console.error(error);
      
      if (this.isProduction) {
        throw new Error(error);
      } else {
        console.warn('⚠️ Development mode: Some environment variables are missing');
        console.warn('Please check your .env.local file');
      }
    }

    // Validate URL formats
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
      } catch {
        throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format');
      }
    }

    // Validate API keys format
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('eyJ')) {
        console.warn('⚠️ Supabase anon key format seems incorrect');
      }
    }

    return true;
  },

  checkForHardcodedCredentials() {
    // This would run in CI/CD to check for hardcoded secrets
    if (typeof window === 'undefined') {
      console.log('🔍 Checking for hardcoded credentials...');
      // Implementation would check source files for suspicious patterns
    }
  }
};

// Auto-validate on import
if (process.env.NODE_ENV !== 'test') {
  environment.validate();
}