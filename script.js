document.addEventListener('DOMContentLoaded', () => {

    // --- بيانات التطبيق ---
    let familyData = {
        members: [],
        nextId: 1
    };

    // --- عناصر DOM ---
    const nameInput = document.getElementById('name-input');
    const addPersonBtn = document.getElementById('add-person-btn');
    const drawTreeBtn = document.getElementById('draw-tree-btn');
    const membersList = document.getElementById('members-list');
    const svg = d3.select("#tree-svg");

    // --- وظائف ---
    function updateMembersList() {
        membersList.innerHTML = ''; // مسح القائمة الحالية
        if (familyData.members.length === 0) {
            membersList.innerHTML = '<p>لم يتم إضافة أي شخص بعد.</p>';
            return;
        }

        familyData.members.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.className = 'member-item';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = `${member.name} (ID: ${member.id})`;

            const parentSelect = document.createElement('select');
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '-- لا أحد --';
            parentSelect.appendChild(defaultOption);

            familyData.members.forEach(otherMember => {
                if (otherMember.id !== member.id) {
                    const option = document.createElement('option');
                    option.value = otherMember.id;
                    option.textContent = otherMember.name;
                    parentSelect.appendChild(option);
                }
            });
            
            parentSelect.value = member.parentId || '';
            parentSelect.addEventListener('change', (e) => {
                member.parentId = e.target.value ? parseInt(e.target.value) : null;
                console.log(`تم تحديث والد ${member.name} إلى:`, member.parentId);
            });

            memberDiv.appendChild(nameSpan);
            memberDiv.appendChild(parentSelect);
            membersList.appendChild(memberDiv);
        });
    }

    function drawTree() {
        // مسح الشجرة القديمة
        svg.selectAll("*").remove();

        if (familyData.members.length === 0) {
            alert("لا يمكن رسم الشجرة بدون أفراد.");
            return;
        }

        const width = svg.node().getBoundingClientRect().width;
        const height = 500;
        const margin = { top: 20, right: 90, bottom: 20, left: 90 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const hierarchyData = d3.stratify()
            .id(d => d.id)
            .parentId(d => d.parentId)
            (familyData.members);

        const treeLayout = d3.tree().size([innerHeight, innerWidth]);
        const root = treeLayout(hierarchyData);

        const links = root.links();
        const nodes = root.descendants();

        // رسم الروابط
        g.selectAll(".tree-link")
            .data(links)
            .enter().append("path")
            .attr("class", "tree-link")
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x)
            );

        // رسم العقد
        const node = g.selectAll(".person-node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "person-node")
            .attr("transform", d => `translate(${d.y},${d.x})`);

        node.append("circle")
            .attr("r", 20);

        node.append("text")
            .text(d => d.data.name)
            .attr("dy", 5);
    }

    // --- معالجات الأحداث ---
    addPersonBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name) {
            const newMember = { id: familyData.nextId++, name: name };
            familyData.members.push(newMember);
            nameInput.value = '';
            updateMembersList();
            console.log("تمت إضافة:", newMember);
        } else {
            alert("الرجاء إدخال اسم.");
        }
    });

    drawTreeBtn.addEventListener('click', drawTree);

    // --- الإعداد الأولي ---
    updateMembersList();
});
