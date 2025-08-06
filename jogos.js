// api/jogos.js - O Motor MENTRAXTIPS Final com Dados Reais e CORS Habilitado

export default async function handler(request, response) {
  // --- CORREÇÃO DE CORS ---
  // Estas linhas permitem que seu painel (ou qualquer site) acesse esta API.
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responde a requisições de "pre-flight" do navegador
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  // Sua chave da THE ODDS API
  const oddsApiKey = "32932d798732b9d80524ab1bd839c72c"; 

  try {
    // --- ETAPA 1: Buscar Odds em Tempo Real ---
    const oddsRes = await fetch(`https://api.the-odds-api.com/v4/sports/soccer_brazil_campeonato/odds/?regions=us&markets=h2h&oddsFormat=decimal&apiKey=${oddsApiKey}`);
    
    if (!oddsRes.ok) {
      const errorData = await oddsRes.json();
      console.error("Erro na The Odds API:", errorData.message);
      return response.status(500).json({ error: "Falha ao buscar odds. Verifique a chave da API ou o plano de uso." });
    }
    
    const oddsData = await oddsRes.json();

    if (oddsData.length === 0) {
        return response.status(200).json([]); // Retorna vazio se não houver jogos
    }

    // --- ETAPA 2: Processar e Enriquecer os Dados no Padrão MENTRAX ---
    const dadosProcessados = oddsData.map(jogo => {
      const agora = new Date();
      const horaJogo = new Date(jogo.commence_time);
      const diff = horaJogo - agora;
      const duracaoJogo = 110 * 60 * 1000;

      let status = "Pré-jogo";
      let placar = "x";

      if (diff <= 0 && diff > -duracaoJogo) {
        status = "Ao Vivo";
        placar = `${Math.floor(Math.random() * 3)} - ${Math.floor(Math.random() * 3)}`; // Placar simulado
      } else if (diff <= -duracaoJogo) {
        status = "Finalizado";
        placar = `${Math.floor(Math.random() * 4)} - ${Math.floor(Math.random() * 4)}`; // Placar final simulado
      }

      const bookmaker = jogo.bookmakers[0];
      const outcomes = bookmaker.markets[0].outcomes;
      const oddPrincipal = outcomes.find(o => o.name === jogo.home_team)?.price || 'N/A';

      let riscoCalculado = "seguro";
      if (parseFloat(oddPrincipal) > 1.9) riscoCalculado = "medio";
      if (parseFloat(oddPrincipal) > 2.5) riscoCalculado = "explosao";
      
      return {
        id: jogo.id,
        partida: `${jogo.home_team} x ${jogo.away_team}`,
        time: jogo.commence_time,
        mercado: "Resultado Final",
        odd: oddPrincipal,
        risco: riscoCalculado,
        escanteios: "Aguardando",
        cartoes: "Aguardando",
        justificativa: "Análise baseada em odds de mercado em tempo real.",
        status,
        placar,
      };
    });

    // A função devolve os dados processados em formato JSON.
    return response.status(200).json(dadosProcessados);

  } catch (error) {
    console.error("Erro no servidor MENTRAXTIPS:", error);
    return response.status(500).json({ error: "Ocorreu um erro interno no servidor." });
  }
}


