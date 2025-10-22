const elements = {
    addMemberBtn: document.getElementById('add-member-btn'),
    downloadBtn: document.getElementById('download-tree-btn'),
    treeContainer: document.getElementById('tree-container'),
    svg: d3.select('#tree-svg'),
    emptyState: document.getElementById('empty-state'),
    modal: document.getElementById('modal'),
    memberForm: document.getElementById('member-form'),
    cancelBtn: document.getElementById('cancel-btn'),
    photoInput: document.getElementById('photo')
};

let familyData = { members: [] };

// 🔧 التحقق من وجود أو عدم وجود بيانات
function checkUIState() {
    if (familyData.members.length === 0) {
        elements.emptyState.style.display = 'flex';
        elements.svg.style('display', 'none');
    } else {
        elements.emptyState.style.display = 'none';
        elements.svg.style('display', 'block');
        renderTree();
    }
}

// 🧩 فتح النافذة لإضافة فرد
elements.addMemberBtn.addEventListener('click', () => {
    openEditModal();
});

elements.cancelBtn.addEventListener('click', () => {
    closeModal();
});

// 🧠 حفظ فرد جديد
elements.memberForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('member-id').value || Date.now().toString();
    const name = document.getElementById('name').value;
    const dob = document.getElementById('dob').value;
    const relationType = document.getElementById('relation-type').value;
    const relationToId = document.getElementById('relation-to').value;

    let newMember = { id, name, dob, photo: '', parentId: null, spouseId: null };

    if (relationToId && relationType) {
        const relative = familyData.members.find(m => m.id === relationToId);

        if (relationType === 'spouse') {
            newMember.spouseId = relationToId;
            relative.spouseId = newMember.id;
        } else if (relationType === 'father' || relationType === 'mother') {
            relative.parentId = newMember.id;
        } else if (relationType === 'son' || relationType === 'daughter') {
            newMember.parentId = relationToId;
        }
    }

    // تحديث أو إضافة
    const existingIndex = familyData.members.findIndex(m => m.id === id);
    if (existingIndex >= 0) familyData.members[existingIndex] = newMember;
    else familyData.members.push(newMember);

    closeModal();
    checkUIState();
});

// 🖼️ عرض الصورة قبل الحفظ
elements.photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => newMember.photo = reader.result;
    reader.readAsDataURL(file);
});

// 🔲 فتح وإغلاق النافذة
function openEditModal(member = null) {
    elements.modal.classList.remove('hidden');
    if (member) {
        document.getElementById('member-id').value = member.id;
        document.getElementById('name').value = member.name;
        document.getElementById('dob').value = member.dob;
    } else {
        elements.memberForm.reset();
        document.getElementById('member-id').value = '';
    }

    const relationSelect = document.getElementById('relation-to');
    relationSelect.innerHTML = '<option value="">بدون</option>';
    familyData.members.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        relationSelect.appendChild(opt);
    });
}

function closeModal() {
    elements.modal.classList.add('hidden');
}

// 🧭 رسم الشجرة (مبدئيًا فقط)
function renderTree() {
    elements.svg.selectAll('*').remove();
    const width = elements.treeContainer.clientWidth;
    const height = elements.treeContainer.clientHeight;
    const root = d3.stratify()
        .id(d => d.id)
        .parentId(d => d.parentId)(familyData.members);

    const treeLayout = d3.tree().size([width - 100, height - 100]);
    const treeData = treeLayout(root);

    const g = elements.svg.append('g').attr('transform', 'translate(50,50)');

    // الروابط
    g.selectAll('path')
        .data(treeData.links())
        .enter()
        .append('path')
        .attr('d', d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y))
        .attr('stroke', '#555')
        .attr('fill', 'none');

    // العقد (الأفراد)
    const nodes = g.selectAll('g.node')
        .data(treeData.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    nodes.append('circle')
        .attr('r', 20)
        .attr('fill', '#2196f3')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    nodes.append('text')
        .attr('dy', 5)
        .attr('text-anchor', 'middle')
        .text(d => d.data.name)
        .attr('fill', 'white');
}

checkUIState();
