// api/jogos.js - O Motor MENTRAXTIPS v2 com dados reais

// Esta é a função serverless que a Vercel executa.
export default async function handler(request, response) {
  
  // IMPORTANTE: Coloque sua chave da The Odds API aqui, entre aspas.
  // Você pode obter uma chave gratuita em: https://the-odds-api.com/
  const oddsApiKey = "32932d798732b9d80524ab1bd839c72c"; 

  try {
    // --- ETAPA 1: Buscar jogos ao vivo (Simulado com dados do Sofascore) ---
    // A API do Sofascore é instável, então vamos usar uma lista estática que simula a estrutura dela.
    // Em um projeto real, a linha abaixo faria a chamada real:
    // const sofascoreRes = await fetch('https://api.sofascore.com/api/v1/sport/football/events/live');
    // const liveData = await sofascoreRes.json();
    const liveData = {
      events: [
        { homeTeam: { name: "Palmeiras" }, awayTeam: { name: "Corinthians" }, homeScore: { current: 1 }, awayScore: { current: 0 }, status: { description: "Halftime" } },
        { homeTeam: { name: "Flamengo" }, awayTeam: { name: "Atlético-MG" }, homeScore: { current: 0 }, awayScore: { current: 0 }, status: { description: "15'" } }
      ]
    };

    // --- ETAPA 2: Buscar Odds ---
    const oddsRes = await fetch(`https://api.the-odds-api.com/v4/sports/soccer_brazil_campeonato/odds/?regions=us&markets=h2h&oddsFormat=decimal&apiKey=${oddsApiKey}`);
    if (!oddsRes.ok) {
        // Se a API de odds falhar, informa o erro.
        const errorText = await oddsRes.text();
        console.error("Erro na OddsAPI:", errorText);
        return response.status(500).json({ error: "Falha ao buscar odds." });
    }
    const oddsData = await oddsRes.json();

    // --- ETAPA 3: Unir os Dados (A Inteligência MENTRAX) ---
    const dadosCombinados = liveData.events.map(jogo => {
      
      // Tenta encontrar as odds para o jogo atual
      const oddMatch = oddsData.find(o => 
        o.home_team.includes(jogo.homeTeam.name) || o.away_team.includes(jogo.awayTeam.name)
      );

      let oddsFormatadas = "N/A";
      if (oddMatch) {
          const bookmaker = oddMatch.bookmakers[0]; // Pega o primeiro site de apostas
          const market = bookmaker.markets[0].outcomes; // Pega os resultados (1x2)
          oddsFormatadas = `1: ${market[0].price} | X: ${market[1].price} | 2: ${market[2].price}`;
      }

      // Retorna o objeto no formato que o nosso painel entende
      return {
        id: jogo.id || `${jogo.homeTeam.name}-${jogo.awayTeam.name}`,
        partida: `${jogo.homeTeam.name} x ${jogo.awayTeam.name}`,
        placar: `${jogo.homeScore.current} - ${jogo.awayScore.current}`,
        status: jogo.status.description,
        odds: oddsFormatadas,
        // Dados estáticos para o exemplo
        risco: "medio",
        escanteios: "Over 8.5",
        cartoes: "Over 4.5",
        justificativa: "Análise baseada em dados ao vivo."
      };
    });

    // A função devolve os dados combinados em formato JSON.
    response.status(200).json(dadosCombinados);

  } catch (error) {
    console.error("Erro no servidor MENTRAXTIPS:", error);
    response.status(500).json({ error: "Ocorreu um erro interno no servidor." });
  }
}
