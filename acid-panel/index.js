'use strict';
const db = require('@arangodb').db;
const joi = require('joi');
const request = require('@arangodb/request');
const createRouter = require('@arangodb/foxx/router');

const router = createRouter();
module.context.use(router);

router.get('/', (req, res) => {
  res.redirect(module.context.mount + '/frontend/index.html');
});

router.post('/api/collections', (req, res) => {
  const { name, fields = [], relations = [], testDocument } = req.body;
  if (!name) {
    res.throw('bad request', 'name required');
  }

  // Create collection if it doesn't exist
  let col = db._collection(name);
  if (!col) {
    col = db._create(name);
  }

  // Build Joi schema
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
        /* ignore bad validation */
      }
    }
    schemaObj[f.name] = fieldSchema;
  });

  // Save schema
  const schemas = db._collection('schemas_config') || db._create('schemas_config');
  schemas.save({ collection: name, schema: JSON.stringify(schemaObj) });

  // Save relations
  if (relations.length) {
    const rels = db._collection('relations_config') || db._create('relations_config');
    relations.forEach(rel => {
      rel.collection = name;
      rels.save(rel);
    });
  }

  // Optional dummy insert via ArangoACID
  if (testDocument) {
    const acidUrl = module.context.configuration.acidUrl.replace(/\/$/, '');
    try {
      request.post(`${acidUrl}/${name}`, { json: testDocument });
    } catch (err) {
      // ignore errors from dummy insert
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

