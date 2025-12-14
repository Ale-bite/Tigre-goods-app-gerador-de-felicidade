import React, { useState, useCallback } from 'react';
import { generateColoringPage } from './services/imageGenerationService';

interface ToastMessage {
  msg: string;
  isError: boolean;
}

const App: React.FC = () => {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

  const showToast = useCallback((msg: string, isError: boolean = false) => {
    setToastMessage({ msg, isError });
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer); // Cleanup function for useEffect/useCallback
  }, []);

  // Function to call the Image Generation API
  const handleGenerateImage = useCallback(async () => {
    setLoading(true);
    setGeneratedImage(null);
    setError(null);
    showToast("Criando Arte...", false);

    const { imageUrl, error: genError } = await generateColoringPage();

    if (imageUrl) {
      setGeneratedImage(imageUrl);
      showToast("Desenho criado com sucesso!", false);
    } else if (genError) {
      setError(genError);
      showToast(genError, true);
    } else {
      // Fallback for unexpected empty response
      setError("Erro inesperado na geração. Tente novamente.");
      showToast("Erro inesperado na geração. Tente novamente.", true);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast]);

  // Function to download the image
  const downloadImage = useCallback(() => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `desenho_tigregoods_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Download iniciado!", false);
    } else {
      showToast("Gere uma imagem antes de tentar baixar.", true);
    }
  }, [generatedImage, showToast]);


  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      
      {/* Custom Toast */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl transition-opacity duration-500 
          ${toastMessage.isError ? 'bg-red-600' : 'bg-yellow-600'} text-white`}>
          {toastMessage.msg}
        </div>
      )}

      {/* Main Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-yellow-800 tracking-tight">
          🐅 Gerador de Desenhos para Colorir
        </h1>
        <p className="mt-2 text-xl text-gray-600">
          Crie desenhos de linha exclusivos no estilo "Tigre Goods" com apenas um clique!
        </p>
      </header>

      <main className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-2xl border-t-8 border-yellow-500">
        
        {/* Simple Input Section (Just a Button) */}
        <section className="mb-8 p-6 bg-yellow-50 rounded-xl flex flex-col items-center">
          <p className="text-lg font-medium text-gray-700 mb-4 text-center">
            Clique abaixo para gerar instantaneamente uma nova página para colorir do Tigre em um local diferente do mundo:
          </p>
          
          <button
            onClick={handleGenerateImage}
            disabled={loading}
            className={`px-8 py-4 text-xl font-bold rounded-xl transition duration-300 shadow-xl w-full max-w-sm
              ${loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-yellow-600 text-white hover:bg-yellow-700 hover:scale-[1.02] transform'
              }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Criando Arte...
              </div>
            ) : (
              'Gerar Novo Desenho Global'
            )}
          </button>
        </section>

        {/* Preview Area and Errors */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">
            Prévia do Desenho Gerado
          </h2>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4">
              <p className="font-bold">Erro na Geração:</p>
              <p>{error}</p>
            </div>
          )}

          <div className="relative flex justify-center items-center min-h-[400px] bg-gray-100 rounded-xl shadow-inner p-4">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 rounded-xl">
                <div className="animate-pulse text-yellow-800 text-xl font-medium">
                  Criando a Arte Final...
                </div>
                <div className="mt-4 animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-600"></div>
              </div>
            )}
            
            {generatedImage ? (
              <div className="flex flex-col items-center w-full">
                <img 
                  src={generatedImage} 
                  alt="Desenho gerado pronto para colorir" 
                  className="max-w-full h-auto max-h-[600px] rounded-lg shadow-2xl border-4 border-white"
                />
                <button
                  onClick={downloadImage}
                  className="mt-6 px-8 py-3 text-white bg-green-600 rounded-xl font-bold shadow-md hover:bg-green-700 transition"
                  title="Baixar Imagem PNG"
                >
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Baixar Desenho
                </button>
              </div>
            ) : (
              !loading && !error && (
                <div className="p-12 text-center text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M19 12h1M18.364 18.364l-.707-.707M12 21v-1m-6.364-1.636l.707-.707M4 12H3m.707-5.293l.707-.707m12.728 12.728l-6.364-6.364M9.663 17l6.364-6.364M12 12V6"></path></svg>
                  <p className="text-xl">Clique em "Gerar Novo Desenho Global" para começar!</p>
                  <p className="text-sm mt-2">Viaje pelo mundo com o Tigre Goods!</p>
                </div>
              )
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-400 text-sm">
        Desenvolvido com IA para Tigre Goods.
      </footer>
    </div>
  );
};

export default App;
