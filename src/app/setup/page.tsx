import { getMissingEnvVars, REQUIRED_ENV_VARS } from '@/lib/env';
import { Logo } from '@/app/logo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Ruta pública que se muestra cuando falta configuración de entorno.
// Es el "fallback" para que la app no falle con ERR_TOO_MANY_REDIRECTS
// ni con un error 500 cuando las variables de entorno no están cargadas.
export default function SetupPage() {
  const missing = getMissingEnvVars();
  const missingSet = new Set<string>(missing);

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo showText={true} />
          </div>
          <CardTitle className="text-2xl">Falta configuración</CardTitle>
          <CardDescription>
            La aplicación no está configurada todavía. Definí las siguientes
            variables de entorno y volvé a desplegar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {REQUIRED_ENV_VARS.map((variable) => {
              const isMissing = missingSet.has(variable.key);
              return (
                <li
                  key={variable.key}
                  className="rounded-md border bg-muted/30 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono text-xs">{variable.key}</code>
                    <span
                      className={
                        isMissing
                          ? 'text-xs font-semibold text-destructive'
                          : 'text-xs font-semibold text-green-500'
                      }
                    >
                      {isMissing ? 'Falta' : 'Configurada'}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{variable.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    {variable.hint}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="text-sm text-muted-foreground">
            Agregá estos valores en <code className="font-mono">.env.local</code>{' '}
            (local) o en las Environment Variables del proyecto en Vercel. Si el
            problema persiste, verificá que estén cargadas para el entorno
            correcto (Production / Preview / Development).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
