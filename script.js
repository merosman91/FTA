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
let tempPhoto = ''; // لتخزين الصورة مؤقتًا عند التحميل

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

// فتح النافذة
elements.addMemberBtn.addEventListener('click', () => openEditModal());
elements.cancelBtn.addEventListener('click', () => closeModal());

// حفظ فرد جديد
elements.memberForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('member-id').value || Date.now().toString();
    const name = document.getElementById('name').value;
    const dob = document.getElementById('dob').value;
    const relationType = document.getElementById('relation-type').value;
    const relationToId = document.getElementById('relation-to').value;

    let newMember = { id, name, dob, photo: tempPhoto, parentId: null, spouseId: null };

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

    const existingIndex = familyData.members.findIndex(m => m.id === id);
    if (existingIndex >= 0) familyData.members[existingIndex] = newMember;
    else familyData.members.push(newMember);

    tempPhoto = ''; // تصفير الصورة المؤقتة
    closeModal();
    checkUIState();
});

// تحميل الصورة
elements.photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => tempPhoto = reader.result;
    reader.readAsDataURL(file);
});

function openEditModal(member = null) {
    elements.modal.classList.remove('hidden');
    elements.memberForm.reset();
    tempPhoto = '';

    if (member) {
        document.getElementById('member-id').value = member.id;
        document.getElementById('name').value = member.name;
        document.getElementById('dob').value = member.dob;
        tempPhoto = member.photo;
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

function renderTree() {
    elements.svg.selectAll('*').remove();

    try {
        const root = d3.stratify()
            .id(d => d.id)
            .parentId(d => d.parentId || null)(familyData.members);

        const treeLayout = d3.tree().nodeSize([100, 150]);
        const treeData = treeLayout(root);

        const g = elements.svg.append('g').attr('transform', 'translate(100,50)');

        // الروابط
        g.selectAll('path.link')
            .data(treeData.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y))
            .attr('stroke', '#aaa')
            .attr('stroke-width', 2)
            .attr('fill', 'none');

        // العقد (الأفراد)
        const nodes = g.selectAll('g.node')
            .data(treeData.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x},${d.y})`);

        // صورة الشخص أو دائرة افتراضية
        nodes.append('defs')
            .append('clipPath')
            .attr('id', d => `clip-${d.id}`)
            .append('circle')
            .attr('r', 30);

        nodes.append('circle')
            .attr('r', 30)
            .attr('fill', '#4a90e2')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('filter', 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))');

        nodes.filter(d => d.data.photo)
            .append('image')
            .attr('xlink:href', d => d.data.photo)
            .attr('width', 60)
            .attr('height', 60)
            .attr('x', -30)
            .attr('y', -30)
            .attr('clip-path', d => `url(#clip-${d.id})`);

        // الاسم تحت الصورة
        nodes.append('text')
            .attr('dy', 50)
            .attr('text-anchor', 'middle')
            .attr('fill', '#333')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .text(d => d.data.name);

    } catch (err) {
        console.warn('⚠️ خطأ في بنية الشجرة: قد تكون العلاقات غير صحيحة', err);
        elements.svg.selectAll('*').remove();
        elements.emptyState.style.display = 'flex';
        elements.emptyState.textContent = 'حدث خطأ في العلاقات، تأكد من أن كل شخص له أب واحد فقط.';
    }
}

checkUIState();
