
"use client";

import { useState, useTransition, useEffect } from "react";
import { Sparkles, Bot, BarChart, ShoppingBag, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { analyzeClient } from "@/app/admin/actions/clients.actions";
import { type AnalyzeClientOutput } from "@/types";

const loadingPhrases = [
    "Consultando los astros de las ventas...",
    "Desenredando patrones de compra...",
    "Destilando insights estratégicos...",
    "Analizando historiales de pedidos...",
    "Buscando pepitas de oro en los datos...",
    "Preparando un espresso y el análisis...",
];

const AnalysisSection = ({ title, icon: Icon, items }: { title: string; icon: React.ElementType; items: string[] }) => {
    if (items.length === 0) return null;
    return (
        <div>
            <h4 className="flex items-center gap-2 font-semibold mb-2">
                <Icon className="h-5 w-5 text-primary" />
                {title}
            </h4>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                {items.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    );
}

export function ClientAnalysis({ clientId }: { clientId: string }) {
    const [isPending, startTransition] = useTransition();
    const [analysis, setAnalysis] = useState<AnalyzeClientOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const [currentPhrase, setCurrentPhrase] = useState(loadingPhrases[0]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPending) {
            interval = setInterval(() => {
                setCurrentPhrase(loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]);
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isPending]);


    const handleAnalyze = () => {
        startTransition(async () => {
            setError(null);
            const result = await analyzeClient(clientId);
            if (result.error) {
                setError(result.error.message);
                toast({ title: "Error en el Análisis", description: result.error.message, variant: "destructive" });
            } else {
                setAnalysis(result.data);
            }
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="text-primary" />
                    Análisis con IA
                </CardTitle>
                <CardDescription>Obtén un resumen y oportunidades sobre este cliente generado por IA.</CardDescription>
            </CardHeader>
            <CardContent>
                {isPending ? (
                    <div className="flex flex-col items-center justify-center text-center gap-4 h-48">
                         <Bot className="h-10 w-10 text-primary animate-bounce" />
                         <p className="text-lg font-medium text-muted-foreground">{currentPhrase}</p>
                    </div>
                ) : error ? (
                     <div className="flex flex-col items-center justify-center text-center gap-4 h-48 text-destructive">
                         <AlertTriangle className="h-10 w-10" />
                         <p className="font-medium">Error al generar el análisis</p>
                         <p className="text-sm">{error}</p>
                         <Button onClick={handleAnalyze} variant="secondary">Reintentar</Button>
                    </div>
                ) : analysis ? (
                    <div className="space-y-6 text-sm animate-in fade-in-50">
                        <div>
                            <p className="font-semibold mb-1 text-base">Resumen del Cliente</p>
                            <p className="text-muted-foreground">{analysis.summary}</p>
                        </div>
                        <AnalysisSection title="Observaciones Clave" icon={BarChart} items={analysis.observations} />
                        <AnalysisSection title="Oportunidades de Venta" icon={ShoppingBag} items={analysis.opportunities} />
                        <AnalysisSection title="Riesgos Potenciales" icon={AlertTriangle} items={analysis.risks} />

                         <Button onClick={handleAnalyze} variant="secondary" size="sm" className="mt-4">
                            Volver a Analizar
                        </Button>
                    </div>
                ) : (
                     <div className="flex flex-col items-center justify-center text-center gap-4 h-48 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Analiza el historial de este cliente para descubrir oportunidades.</p>
                        <Button onClick={handleAnalyze} disabled={isPending}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generar Análisis
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
