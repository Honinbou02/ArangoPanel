const showButton = document.getElementById('showInterface');
const panel = document.getElementById('interface');

if (showButton && panel) {
  showButton.addEventListener('click', () => {
    panel.style.display = 'block';
    showButton.style.display = 'none';
  });
}

function addFieldRow() {
  const baseRow = document.querySelector('#fieldsTable tbody tr');
  if (!baseRow) return;

  const row = baseRow.cloneNode(true);
  row.querySelectorAll('input').forEach(i => i.value = '');
  row.querySelector('.fieldRequired').checked = false;

  const removeBtn = row.querySelector('.removeField');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => row.remove());
  }

  document.querySelector('#fieldsTable tbody').appendChild(row);
}

function addRelationRow() {
  const baseRow = document.querySelector('#relationsTable tbody tr');
  if (!baseRow) return;

  const row = baseRow.cloneNode(true);
  row.querySelectorAll('input').forEach(i => i.value = '');
  row.querySelector('.relOnDelete').value = 'cascade';

  const removeBtn = row.querySelector('.removeRelation');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => row.remove());
  }

  document.querySelector('#relationsTable tbody').appendChild(row);
  preencherCollections();
}

document.querySelectorAll('.removeField').forEach(btn =>
  btn.addEventListener('click', e => e.target.closest('tr').remove())
);
document.querySelectorAll('.removeRelation').forEach(btn =>
  btn.addEventListener('click', e => e.target.closest('tr').remove())
);

document.getElementById('addField')?.addEventListener('click', addFieldRow);
document.getElementById('addRelation')?.addEventListener('click', addRelationRow);

document.getElementById('createBtn')?.addEventListener('click', async () => {
  const name = document.getElementById('collectionName').value.trim();
  if (!name) return alert('Collection name is required');

  const fields = Array.from(document.querySelectorAll('#fieldsTable tbody tr')).map(row => ({
    name: row.querySelector('.fieldName').value.trim(),
    type: row.querySelector('.fieldType').value,
    required: row.querySelector('.fieldRequired').checked,
    validations: row.querySelector('.fieldValidations').value.trim()
  })).filter(f => f.name);

  if (fields.length === 0) return alert('At least one field is required');

  const schemaProps = {};
  const requiredFields = [];
  const testDoc = {};

  try {
    fields.forEach(f => {
      const prop = { type: f.type };
      if (f.validations) {
        const rules = JSON.parse(f.validations);
        if (f.type === 'string') {
          if (rules.min) prop.minLength = rules.min;
          if (rules.max) prop.maxLength = rules.max;
        }
        if (f.type === 'number') {
          if (rules.min) prop.minimum = rules.min;
          if (rules.max) prop.maximum = rules.max;
        }
      }
      schemaProps[f.name] = prop;
      if (f.required) requiredFields.push(f.name);
      testDoc[f.name] = f.type === 'number' ? 0 : '';
    });
  } catch (e) {
    return alert('Erro ao analisar validações JSON: ' + e.message);
  }

  const baseUrl = '/_db/_system';

  try {
    // 1. Criar collection
    const colRes = await fetch(`${baseUrl}/_api/collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name })
    });
    const colData = await colRes.json();
    if (!colRes.ok) throw new Error(colData.errorMessage || 'Erro ao criar collection');

    // 2. Definir schema
    const schemaRes = await fetch(`${baseUrl}/_api/collection/${name}/properties`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        schema: {
          rule: {
            type: 'object',
            properties: schemaProps,
            required: requiredFields
          },
          level: 'moderate',
          message: 'Documento inválido'
        }
      })
    });
    const schemaData = await schemaRes.json();
    if (!schemaRes.ok) throw new Error(schemaData.errorMessage || 'Erro ao definir schema');

    // 3. Inserir documento teste
    const insertRes = await fetch(`${baseUrl}/_api/document/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(testDoc)
    });
    const insertData = await insertRes.json();
    if (!insertRes.ok) throw new Error(insertData.errorMessage || 'Erro ao inserir documento');

    // 4. Relações (salva na collection relations_config)
    const relationRows = document.querySelectorAll('#relationsTable tbody tr');
    const relations = Array.from(relationRows).map(row => {
      const localField = row.querySelector('.relField')?.value.trim();
      const refCollection = row.querySelector('.relRefCollection')?.value;
      const refField = row.querySelector('.relRefField')?.value.trim() || '_key';
      const onDelete = row.querySelector('.relOnDelete')?.value || 'cascade';

      if (localField && refCollection) {
        return { localField, refCollection, refField, onDelete };
      }
      return null;
    }).filter(r => r !== null);

    if (relations.length > 0) {
      const configRes = await fetch(`${baseUrl}/_api/document/relations_config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          _key: name,
          relations
        })
      });

      const configData = await configRes.json();
      if (!configRes.ok) throw new Error(configData.errorMessage || 'Erro ao salvar relações');
    }

    alert('✅ Collection criada com sucesso!');
  } catch (err) {
    alert('❌ Erro: ' + err.message);
  }
});

async function preencherCollections() {
  const baseUrl = '/_db/_system';

  try {
    const res = await fetch(`${baseUrl}/_api/collection`, {
      credentials: 'include'
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.errorMessage || 'Erro ao buscar collections');

    const names = data.result.map(c => c.name).sort();
    const selects = document.querySelectorAll('.relRefCollection');

    selects.forEach(select => {
      select.innerHTML = '';
      names.forEach(name => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = name;
        select.appendChild(opt);
      });
    });
  } catch (err) {
    console.error('Erro ao buscar collections:', err.message);
  }
}

window.addEventListener('DOMContentLoaded', preencherCollections);
