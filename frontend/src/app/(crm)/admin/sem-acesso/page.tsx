"use client";

import { useRouter } from "next/navigation";
import { ShieldOff } from "lucide-react";

export default function SemAcessoPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <ShieldOff size={24} className="text-red-500" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Sem permissão
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        Seu perfil não tem acesso a esta página. Fale com um administrador.
      </p>
      <button
        onClick={() => router.back()}
        className="mt-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        Voltar
      </button>
    </div>
  );
}
