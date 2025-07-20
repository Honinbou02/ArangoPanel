'use strict';

const db = require('@arangodb').db;
const joi = require('joi');
const request = require('@arangodb/request');
const fs = require('fs');
const createRouter = require('@arangodb/foxx/router');

const router = createRouter();
module.context.use(router);

// ✅ Serve arquivos estáticos da RAIZ (index.html, script.js, etc.)
try {
  if (typeof module.context.static === 'function') {
    module.context.use("/", module.context.static("."));
  } else {
    // fallback para Arango < 3.10
    router.get('/:file', function (req, res) {
      const file = module.context.fileName(req.pathParams.file);
      if (!fs.exists(file)) {
        res.throw('not found', 'Arquivo não encontrado');
      }
      res.send(fs.read(file));
    }).pathParam('file', joi.string().required());
  }
} catch (e) {
  // fallback seguro
  router.get('/:file', function (req, res) {
    const file = module.context.fileName(req.pathParams.file);
    if (!fs.exists(file)) {
      res.throw('not found', 'Arquivo não encontrado');
    }
    res.send(fs.read(file));
  }).pathParam('file', joi.string().required());
}

// ✅ Redireciona "/" para index.html
router.get('/', (req, res) => {
  res.redirect(module.context.mount + '/index.html');
});

// ✅ API: Criação de collection + schema + relações
router.post('/api/collections', (req, res) => {
  const { name, fields = [], relations = [], testDocument } = req.body;

  if (!name) {
    res.throw('bad request', 'name required');
  }

  // Cria a coleção
  let col = db._collection(name);
  if (!col) {
    col = db._create(name);
  }

  // Monta schema Joi
  const schemaObj = {};
  fields.forEach(f => {
    let fieldSchema = joi;
    switch (f.type) {
      case 'number':
        fieldSchema = fieldSchema.number();
        break;
      case 'boolean':
        fieldSchema = fieldSchema.boolean();
        break;
      default:
        fieldSchema = fieldSchema.string();
    }
    if (f.required) fieldSchema = fieldSchema.required();
    if (f.validations) {
      try {
        const rules = JSON.parse(f.validations);
        Object.keys(rules).forEach(k => {
          if (typeof fieldSchema[k] === 'function') {
            const val = Array.isArray(rules[k]) ? rules[k] : [rules[k]];
            fieldSchema = fieldSchema[k](...val);
          }
        });
      } catch (err) {
        // ignora validações inválidas
      }
    }
    schemaObj[f.name] = fieldSchema;
  });

  // Salva schema
  const schemas = db._collection('schemas_config') || db._create('schemas_config');
  schemas.save({
    collection: name,
    schema: JSON.stringify(schemaObj)
  });

  // Salva relações (FKs)
  if (relations.length) {
    const rels = db._collection('relations_config') || db._create('relations_config');
    relations.forEach(rel => {
      rel.collection = name;
      rels.save(rel);
    });
  }

  // Testa inserção via ArangoACID (opcional)
  if (testDocument) {
    const acidUrl = module.context.configuration.acidUrl.replace(/\/$/, '');
    try {
      request.post(`${acidUrl}/api/${name}`, {
        json: testDocument
      });
    } catch (err) {
      // ignora erro do insert
    }
  }

  res.send({ success: true });
})
.body(joi.object({
  name: joi.string().required(),
  fields: joi.array().items(joi.object({
    name: joi.string().required(),
    type: joi.string().required(),
    required: joi.boolean().optional(),
    validations: joi.string().allow('').optional()
  })).optional(),
  relations: joi.array().items(joi.object({
    field: joi.string().required(),
    refCollection: joi.string().required(),
    refField: joi.string().required(),
    onDelete: joi.string().optional()
  })).optional(),
  testDocument: joi.object().optional()
}).required(), 'collection definition');
