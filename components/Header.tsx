import Image from "next/image"

export function Header() {
  return (
    <div className="w-full bg-white border-b shadow-sm">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/sbu.png"
              alt="Prefeitura de São Bento do Una"
              width={300}
              height={80}
              priority
              className="h-20 w-auto"
            />
            <div className="h-8 w-px bg-gray-200 hidden sm:block" />
            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold text-red-700">Secretaria de</h2>
              <h3 className="text-xl font-bold text-red-800">ASSISTÊNCIA SOCIAL</h3>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-lg font-semibold text-green-700">PREFEITURA MUNICIPAL</h1>
            <h2 className="text-xl font-bold text-red-800">SÃO BENTO DO UNA</h2>
            <div className="text-sm text-green-700 font-medium">COM AMOR E TRABALHO</div>
          </div>
        </div>
      </div>
    </div>
  )
} 