// Cole este código no Console do navegador (F12) para carregar dados de exemplo

const dadosExemplo = {
  users: [
    {
      name: "João Silva",
      faltantes: ["USA-3", "USA-6", "BRA-1", "BRA-5", "ARG-2", "FWC-7"],
      repetidas: ["ESP-1", "ESP-3", "POR-2", "FRA-4", "ITA-5"]
    },
    {
      name: "Maria Santos",
      faltantes: ["ESP-1", "POR-2", "GER-8", "FRA-10"],
      repetidas: ["USA-3", "USA-6", "BRA-1", "MEX-7", "CHI-9"]
    },
    {
      name: "Pedro Costa",
      faltantes: ["FRA-4", "ITA-5", "GER-6"],
      repetidas: ["BRA-5", "ARG-2", "COL-3", "URU-8", "FWC-7"]
    }
  ]
};

localStorage.setItem('figurinhas_users', JSON.stringify(dadosExemplo.users));
alert('✅ Dados de exemplo carregados! Recarregue a página (F5)');
location.reload();
