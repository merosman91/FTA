document.addEventListener('DOMContentLoaded', () => {

    // --- 1. هيكل البيانات (يبدأ فارغًا) ---
    let familyData = {
        members: [],
        nextId: 1
    };
    
    // بيانات المتعاونين (محاكاة)
    const collaborators = ["أنت", "خالد أحمد (محرر)"];

    // --- 2. عناصر DOM ---
    const svg = d3.select("#tree-svg");
    const treeContainer = document.querySelector('.tree-container');
    const emptyState = document.getElementById('empty-state');
    const addMemberBtn = document.getElementById('add-member-btn');
    const shareBtn = document.getElementById('share-btn');
    const memberModal = document.getElementById('member-modal');
    const detailsModal = document.getElementById('details-modal');
    const memberForm = document.getElementById('member-form');
    const modalTitle = document.getElementById('modal-title');
    const relationToSelect = document.getElementById('relation-to');
    const closeBtns = document.querySelectorAll('.close-btn');
    const editMemberBtn = document.getElementById('edit-member-btn');
    const deleteMemberBtn = document.getElementById('delete-member-btn');
    const photoInput = document.getElementById('photo');

    let currentEditingMember = null;
    let currentViewingMember = null;
    let currentPhotoDataUrl = null;

    const width = treeContainer.clientWidth;
    const height = treeContainer.clientHeight;
    const margin = {top: 50, right: 50, bottom: 50, left: 50};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // إعداد D3 Tree Layout
    const treeLayout = d3.tree().size([innerHeight, innerWidth]);

    // --- 3. دوال مساعدة ---
    function findMember(id) {
        return familyData.members.find(m => m.id === id);
    }

    function getChildren(parentId) {
        return familyData.members.filter(m => m.parentId === parentId);
    }
    
    function getSpouse(memberId) {
        const member = findMember(memberId);
        if (!member || !member.spouseId) return null;
        return findMember(member.spouseId);
    }
    
    function checkUIState() {
        if (familyData.members.length === 0) {
            emptyState.style.display = 'flex';
            svg.style('display', 'none');
        } else {
            emptyState.style.display = 'none';
            svg.style('display', 'block');
            renderTree();
        }
    }

    // --- 4. دالة رسم الشجرة باستخدام D3.js ---
    function renderTree() {
        svg.selectAll("*").remove();

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // تحويل البيانات المسطحة إلى بنية هرمية
        const rootMembers = familyData.members.filter(m => !m.parentId);
        if (rootMembers.length === 0) return; // لا ترسم شيئًا إذا لم يكن هناك جذر

        // نختار أول جذر كنقطة بداية للشجرة الرئيسية
        const hierarchyData = d3.stratify()
            .id(d => d.id)
            .parentId(d => d.parentId)
            (familyData.members);

        const treeNodes = treeLayout(hierarchyData);
        const treeLinks = treeNodes.links();

        // رسم الروابط
        const link = g.selectAll(".tree-link")
            .data(treeLinks)
            .enter().append("path")
            .attr("class", "tree-link")
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x)
            );

        // رسم العقد
        const node = g.selectAll(".person-node")
            .data(treeNodes.descendants())
            .enter().append("g")
            .attr("class", d => `person-node ${d.data.gender} ${d.data.deathYear ? 'deceased' : ''}`)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .on("click", (event, d) => showDetails(d.data.id));

        // إضافة الصور أو الدوائر الملونة
        node.append("defs").append("clipPath")
            .attr("id", d => `clip-${d.data.id}`)
            .append("circle")
            .attr("r", 30);

        node.append("image")
            .attr("xlink:href", d => d.data.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.data.name)}&background=${d.data.gender === 'male' ? '3498db' : 'e91e63'}&color=fff&size=60`)
            .attr("x", -30)
            .attr("y", -30)
            .attr("width", 60)
            .attr("height", 60)
            .attr("clip-path", d => `url(#clip-${d.data.id})`);
            
        node.append("circle")
            .attr("r", 30)
            .style("fill", "transparent") // لجعل الدائرة حدودًا فقط
            .style("stroke", "#2c3e50")
            .style("stroke-width", 3);

        node.append("text")
            .attr("dy", 50)
            .style("text-anchor", "middle")
            .text(d => d.data.name);
    }


    // --- 5. دوال النوافذ المنبثقة ---
    function openModal(modal) {
        modal.style.display = 'block';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
        memberForm.reset();
        currentEditingMember = null;
        currentViewingMember = null;
        currentPhotoDataUrl = null;
    }

    function populateRelationSelect() {
        relationToSelect.innerHTML = '<option value="">-- لا شيء (جذر الشجرة) --</option>';
        familyData.members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.name;
            relationToSelect.appendChild(option);
        });
    }

    function showDetails(memberId) {
        const member = findMember(memberId);
        if (!member) return;

        currentViewingMember = member;
        document.getElementById('details-name').textContent = member.name;
        document.getElementById('details-photo').src = member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=34495e&color=fff&size=100`;
        
        const info = [
            `النوع: ${member.gender === 'male' ? 'ذكر' : 'أنثى'}`,
            `سنة الميلاد: ${member.birthYear || 'غير محدد'}`,
            `سنة الوفاة: ${member.deathYear || 'على قيد الحياة'}`
        ];
        document.getElementById('details-info').innerHTML = info.join('<br>');
        document.getElementById('details-story').textContent = member.story || 'لم تتم إضافة قصة بعد.';
        
        openModal(detailsModal);
    }

    function openAddModal() {
        modalTitle.textContent = 'إضافة فرد جديد';
        document.getElementById('relation-group').style.display = 'block';
        document.getElementById('relation-type-group').style.display = 'block';
        populateRelationSelect();
        openModal(memberModal);
    }

    function openEditModal(memberId) {
        const member = findMember(memberId);
        if (!member) return;

        currentEditingMember = member;
        modalTitle.textContent = 'تعديل بيانات الفرد';
        document.getElementById('member-id').value = member.id;
        document.getElementById('name').value = member.name;
        document.getElementById('gender').value = member.gender;
        document.getElementById('birth-year').value = member.birthYear || '';
        document.getElementById('death-year').value = member.deathYear || '';
        document.getElementById('story').value = member.story || '';
        
        // إخفاء حقول العلاقة عند التعديل
        document.getElementById('relation-group').style.display = 'none';
        document.getElementById('relation-type-group').style.display = 'none';

        openModal(memberModal);
    }
    
    function deleteMember(memberId) {
        if (confirm('هل أنت متأكد من حذف هذا الفرد؟ سيؤثر هذا على الأبناء المرتبطين به.')) {
            const children = getChildren(memberId);
            children.forEach(child => child.parentId = null);

            const member = findMember(memberId);
            if(member.spouseId) {
                const spouse = findMember(member.spouseId);
                if(spouse) spouse.spouseId = null;
            }

            familyData.members = familyData.members.filter(m => m.id !== memberId);
            
            closeModal(detailsModal);
            checkUIState();
        }
    }

    // --- 6. معالجات الأحداث (Event Listeners) ---
    addMemberBtn.addEventListener('click', openAddModal);

    shareBtn.addEventListener('click', () => {
        alert('تم نسخ رابط المشاركة!\n(هذه ميزة تجريبية)');
        // في تطبيق حقيقي، ستقوم بإنشاء رalink فريد ونسخه إلى الحافظة
    });

    photoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentPhotoDataUrl = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    memberForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(memberForm);
        const name = formData.get('name');
        const gender = formData.get('gender');
        const birthYear = parseInt(formData.get('birth-year')) || null;
        const deathYear = parseInt(formData.get('death-year')) || null;
        const story = formData.get('story');
        const relationToId = parseInt(formData.get('relation-to'));
        const relationType = formData.get('relation-type');

        if (currentEditingMember) {
            const member = findMember(currentEditingMember.id);
            member.name = name;
            member.gender = gender;
            member.birthYear = birthYear;
            member.deathYear = deathYear;
            member.story = story;
            if(currentPhotoDataUrl) member.photo = currentPhotoDataUrl;
        } else {
            const newMember = {
                id: familyData.nextId++,
                name,
                gender,
                birthYear,
                deathYear,
                story,
                photo: currentPhotoDataUrl,
                parentId: null,
                spouseId: null
            };

            if (relationToId) {
                const relative = findMember(relationToId);
                if (relationType === 'spouse') {
                    newMember.spouseId = relationToId;
                    relative.spouseId = newMember.id;
                } else {
                    newMember.parentId = relationToId;
                }
            }
            familyData.members.push(newMember);
        }

        closeModal(memberModal);
        checkUIState();
    });

    editMemberBtn.addEventListener('click', () => {
        if (currentViewingMember) {
            closeModal(detailsModal);
            openEditModal(currentViewingMember.id);
        }
    });

    deleteMemberBtn.addEventListener('click', () => {
        if (currentViewingMember) {
            deleteMember(currentViewingMember.id);
        }
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.closest('.modal'));
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === memberModal) closeModal(memberModal);
        if (e.target === detailsModal) closeModal(detailsModal);
    });

    // --- 7. التشغيل الأولي ---
    // عرض المتعاونين (محاكاة)
    const collaboratorList = document.querySelector('.collaborator-list');
    collaborators.forEach(name => {
        const div = document.createElement('div');
        div.className = 'collaborator';
        div.textContent = name;
        collaboratorList.appendChild(div);
    });

    checkUIState();
});
