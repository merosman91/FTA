document.addEventListener('DOMContentLoaded', () => {

    // --- 1. هيكل البيانات ---
    // في تطبيق حقيقي، هذه البيانات ستأتي من قاعدة البيانات (API)
    let familyData = {
        members: [
            { id: 1, name: 'أحمد علي', gender: 'male', birthYear: 1950, parentId: null },
            { id: 2, name: 'فاطمة محمد', gender: 'female', birthYear: 1955, parentId: null, spouseId: 1 },
            { id: 3, name: 'خالد أحمد', gender: 'male', birthYear: 1975, parentId: 1 },
            { id: 4, name: 'مريم أحمد', gender: 'female', birthYear: 1978, parentId: 1 },
            { id: 5, name: 'نورة خالد', gender: 'female', birthYear: 2005, parentId: 3 },
        ],
        nextId: 6
    };

    // --- 2. عناصر DOM ---
    const svg = document.getElementById('tree-svg');
    const addMemberBtn = document.getElementById('add-member-btn');
    const memberModal = document.getElementById('member-modal');
    const detailsModal = document.getElementById('details-modal');
    const memberForm = document.getElementById('member-form');
    const modalTitle = document.getElementById('modal-title');
    const relationToSelect = document.getElementById('relation-to');
    const closeBtns = document.querySelectorAll('.close-btn');
    const editMemberBtn = document.getElementById('edit-member-btn');
    const deleteMemberBtn = document.getElementById('delete-member-btn');

    let currentEditingMember = null;
    let currentViewingMember = null;

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

    // --- 4. دالة رسم الشجرة ---
    function renderTree() {
        svg.innerHTML = ''; // مسح الشجرة الحالية
        
        const nodeWidth = 150;
        const nodeHeight = 100;
        const verticalGap = 120;

        // حساب مواضع العقد بشكل بسيط (هرمي)
        const rootMembers = familyData.members.filter(m => !m.parentId);
        let currentY = 50;
        
        rootMembers.forEach(root => {
            const subtreeLayout = calculateSubtreeLayout(root, nodeWidth, verticalGap);
            drawSubtree(root, subtreeLayout, 400, currentY);
            currentY += subtreeLayout.height + verticalGap * 2;
        });
    }
    
    function calculateSubtreeLayout(member, nodeWidth, verticalGap) {
        const children = getChildren(member.id);
        if (children.length === 0) {
            return { width: nodeWidth, height: verticalGap };
        }
        
        let totalWidth = 0;
        let maxHeight = 0;
        children.forEach(child => {
            const layout = calculateSubtreeLayout(child, nodeWidth, verticalGap);
            totalWidth += layout.width;
            maxHeight = Math.max(maxHeight, layout.height);
        });
        
        return { width: Math.max(nodeWidth, totalWidth), height: maxHeight + verticalGap };
    }

    function drawSubtree(member, layout, x, y) {
        // رسم خطوط الأبناء أولاً (حتى تكون تحت العقد)
        const children = getChildren(member.id);
        if (children.length > 0) {
            const childY = y + 100;
            let childX = x - (layout.width / 2) + (layout.width / children.length) / 2;
            children.forEach(child => {
                const childLayout = calculateSubtreeLayout(child, 150, 120);
                drawLine(x, y + 30, childX, childY - 30);
                drawSubtree(child, childLayout, childX, childY);
                childX += childLayout.width;
            });
        }
        
        // رسم خط الزوجين
        const spouse = getSpouse(member.id);
        if (spouse) {
            // تجنب رسم الزوج مرتين
            if (member.gender === 'male') {
                drawLine(x + 30, y, x + 60, y); // خط أفقي قصير
                drawNode(spouse, x + 90, y);
            }
        }

        // رسم العقدة الحالية
        drawNode(member, x, y);
    }

    function drawNode(member, x, y) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.classList.add('person-node', member.gender);
        g.setAttribute('transform', `translate(${x}, ${y})`);
        g.setAttribute('data-id', member.id);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', '30');
        circle.setAttribute('cx', '0');
        circle.setAttribute('cy', '0');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('y', '5');
        text.textContent = member.name;

        g.appendChild(circle);
        g.appendChild(text);
        svg.appendChild(g);

        g.addEventListener('click', () => showDetails(member.id));
    }
    
    function drawLine(x1, y1, x2, y2) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const midY = (y1 + y2) / 2;
        line.setAttribute('d', `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`);
        line.classList.add('tree-link');
        svg.appendChild(line);
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
        const info = [
            `النوع: ${member.gender === 'male' ? 'ذكر' : 'أنثى'}`,
            `سنة الميلاد: ${member.birthYear || 'غير محدد'}`
        ];
        document.getElementById('details-info').innerHTML = info.join('<br>');
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
        
        // إخفاء حقول العلاقة عند التعديل
        document.getElementById('relation-group').style.display = 'none';
        document.getElementById('relation-type-group').style.display = 'none';

        openModal(memberModal);
    }
    
    function deleteMember(memberId) {
        if (confirm('هل أنت متأكد من حذف هذا الفرد؟ سؤؤثر على الأبناء المرتبطين به.')) {
            // حذف الأبناء أولاً (أو يمكنك إعادة ربطهم بجد آخر)
            const children = getChildren(memberId);
            children.forEach(child => child.parentId = null);

            // حذف الزوج/ة
            const member = findMember(memberId);
            if(member.spouseId) {
                const spouse = findMember(member.spouseId);
                if(spouse) spouse.spouseId = null;
            }

            // حذف العضو نفسه
            familyData.members = familyData.members.filter(m => m.id !== memberId);
            
            closeModal(detailsModal);
            renderTree();
        }
    }


    // --- 6. معالجات الأحداث (Event Listeners) ---
    addMemberBtn.addEventListener('click', openAddModal);

    memberForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(memberForm);
        const name = formData.get('name');
        const gender = formData.get('gender');
        const birthYear = formData.get('birth-year');
        const relationToId = parseInt(formData.get('relation-to'));
        const relationType = formData.get('relation-type');

        if (currentEditingMember) {
            // منطق التعديل
            const member = findMember(currentEditingMember.id);
            member.name = name;
            member.gender = gender;
            member.birthYear = parseInt(birthYear) || null;
        } else {
            // منطق الإضافة
            const newMember = {
                id: familyData.nextId++,
                name,
                gender,
                birthYear: parseInt(birthYear) || null,
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
        renderTree();
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
    renderTree();
});
