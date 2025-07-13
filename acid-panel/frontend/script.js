const showButton = document.getElementById('showInterface');
const panel = document.getElementById('interface');
showButton.addEventListener('click', () => {
  panel.style.display = 'block';
  showButton.style.display = 'none';
});

function addFieldRow() {
  const row = document.querySelector('#fieldsTable tbody tr').cloneNode(true);
  row.querySelectorAll('input').forEach(i => i.value = '');
  row.querySelector('.fieldRequired').checked = false;
  row.querySelector('.removeField').addEventListener('click', () => row.remove());
  document.querySelector('#fieldsTable tbody').appendChild(row);
}

function addRelationRow() {
  const row = document.querySelector('#relationsTable tbody tr').cloneNode(true);
  row.querySelectorAll('input').forEach(i => i.value = '');
  row.querySelector('.relOnDelete').value = 'cascade';
  row.querySelector('.removeRelation').addEventListener('click', () => row.remove());
  document.querySelector('#relationsTable tbody').appendChild(row);
}

// attach remove handler to initial rows
document.querySelectorAll('.removeField').forEach(btn => btn.addEventListener('click', e => e.target.closest('tr').remove()));
document.querySelectorAll('.removeRelation').forEach(btn => btn.addEventListener('click', e => e.target.closest('tr').remove()));

document.getElementById('addField').addEventListener('click', addFieldRow);
document.getElementById('addRelation').addEventListener('click', addRelationRow);

document.getElementById('createBtn').addEventListener('click', async () => {
  const name = document.getElementById('collectionName').value.trim();
  const fields = Array.from(document.querySelectorAll('#fieldsTable tbody tr')).map(row => ({
    name: row.querySelector('.fieldName').value,
    type: row.querySelector('.fieldType').value,
    required: row.querySelector('.fieldRequired').checked,
    validations: row.querySelector('.fieldValidations').value
  }));
  const relations = Array.from(document.querySelectorAll('#relationsTable tbody tr')).map(row => ({
    field: row.querySelector('.relField').value,
    refCollection: row.querySelector('.relRefCollection').value,
    refField: row.querySelector('.relRefField').value,
    onDelete: row.querySelector('.relOnDelete').value
  }));
  const payload = { name, fields, relations };
  const res = await fetch('api/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  alert(data.success ? 'Collection created' : 'Error');
});

