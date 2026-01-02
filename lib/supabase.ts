import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Não lançar no momento da importação para permitir build/prerender.
  // Em ambiente de produção, configure as variáveis `NEXT_PUBLIC_SUPABASE_URL`
  // e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no provedor (Vercel, etc.).
  // Exportamos um proxy que lança um erro claro quando usado em tempo de execução.
  // Isso evita falhas durante o build (pre-render) causadas por throws no topo do módulo.
  // eslint-disable-next-line no-console
  console.warn("Supabase não configurado: variáveis de ambiente faltando. Algumas operações podem falhar em tempo de execução.")

  const missing = new Proxy(
    {},
    {
      get() {
        return () => {
          throw new Error(
            "Supabase não está configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
          )
        }
      },
    }
  )

  export const supabase: any = missing
} else {
  export const supabase = createClient(supabaseUrl, supabaseAnonKey)
}

