🧪 ArangoPanel

ArangoPanel é um microserviço Foxx que fornece uma interface visual para criar collections e schemas com validações no ArangoDB, diretamente do navegador, sem necessidade de build ou dependências externas.
✨ O que é?

Este painel foi criado para facilitar a modelagem de dados no ArangoDB, oferecendo uma experiência parecida com o Firebase ou MongoDB Atlas — só que 100% client-side e utilizando recursos nativos da API HTTP do ArangoDB.

Com ele, você pode:

    Criar collections com nome personalizado
    Adicionar campos com tipo (string, number, boolean)
    Marcar campos como obrigatórios
    Incluir validações extras via JSON (min, max, pattern, etc.)
    Gerar automaticamente schemas no padrão do ArangoDB
    Visualizar erros de schema no Studio após aplicar as validações
    Rodar sem build, sem transpile, sem dependência externa

🚀 Como usar

    Monte o serviço Foxx (ou sirva os arquivos via MinIO, Nginx ou file:// local).
    Acesse o endpoint montado (ex: http://localhost:8529/_db/_system/acid-panel).
    Preencha os campos da interface:
        Nome da collection
        Campos desejados com tipo, obrigatoriedade e validações
    Clique em "Criar Collection com Schema"
    O painel enviará a requisição para o ArangoDB via API RESTful padrão.

🧠 Exemplo de schema gerado

{
  "message": "Documento inválido",
  "level": "moderate",
  "type": "json",
  "rule": {
    "type": "object",
    "properties": {
      "email": { "type": "string" },
      "senha": { "type": "string" }
    },
    "required": ["email", "senha"]
  }
}

🛠 Tecnologias Utilizadas

    HTML5 + CSS3
    JavaScript puro (sem frameworks)
    API HTTP nativa do ArangoDB
    Autenticação Basic (btoa codificado)

📦 Estrutura do Projeto

/arango-panel
│
├── index.html        → Interface principal
├── script.js         → Lógica de criação, schema e requisições
├── style.css         → Estilo moderno e responsivo (embed ou separado)
└── README.md         → Este arquivo

🔭 Próximos Passos (Roadmap)

Se quiser evoluir esse painel para algo ainda mais poderoso, aqui vão ideias concretas:
✅ Lote 1 — Funcionalidade

    Suporte a tipos complexos: object, array, enum
    Botão de Exportar JSON Schema
    Importar JSON Schema existente e carregar no painel
    Suporte a validações mais avançadas (pattern, format, const, etc.)
    Adição de description para cada campo

✅ Lote 2 — UX e UI

    Dark mode 🌙
    Tooltips explicativos para cada tipo de validação
    Validação em tempo real dos JSONs escritos

✅ Lote 3 — Power Features

    Modo “Edge Collection” com checkbox
    Suporte a relacionamentos (edge) com visualização de grafo simples
    Listagem de collections existentes + botão “Editar schema”
    Integração com Foxx para rotas customizadas (criação segura)

👨‍💻 Autor

Desenvolvido com raiva e suor por @Honinbou02
🧩 Licença
MIT — pode clonar, melhorar e usar no seu projeto.
Se lucrar muito, só lembra da gente 😉
