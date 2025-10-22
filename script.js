// عناصر الصفحة
const elements = {
  svg: d3.select("#tree-svg"),
  emptyState: document.getElementById("empty-state"),
  addFirstBtn: document.getElementById("add-first-member"),
  modal: document.getElementById("member-modal"),
  form: document.getElementById("member-form"),
  nameInput: document.getElementById("name"),
  relationType: document.getElementById("relation-type"),
  relationTo: document.getElementById("relation-to"),
  photoInput: document.getElementById("photo"),
  memberIdInput: document.getElementById("member-id"),
  cancelBtn: document.getElementById("cancel-member"),
  contextMenu: document.getElementById("context-menu")
};

let members = [];
let selectedMember = null;

// فتح وإغلاق النافذة
elements.addFirstBtn.addEventListener("click", () => openModal());
elements.cancelBtn.addEventListener("click", closeModal);

function openModal(member = null) {
  elements.modal.classList.remove("hidden");
  if (member) {
    elements.memberIdInput.value = member.id;
    elements.nameInput.value = member.name;
    document.getElementById("modal-title").textContent = "تعديل فرد";
  } else {
    elements.memberIdInput.value = "";
    elements.nameInput.value = "";
    document.getElementById("modal-title").textContent = "إضافة فرد";
  }

  updateRelationOptions();
}

function closeModal() {
  elements.modal.classList.add("hidden");
  elements.form.reset();
}

// تحديث قائمة "يتعلق بـ"
function updateRelationOptions() {
  elements.relationTo.innerHTML = '<option value="">بدون</option>';
  members.forEach(m => {
    const option = document.createElement("option");
    option.value = m.id;
    option.textContent = m.name;
    elements.relationTo.appendChild(option);
  });
}

// إضافة أو تعديل عضو
elements.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = elements.memberIdInput.value || Date.now().toString();
  const name = elements.nameInput.value.trim();
  const relationType = elements.relationType.value;
  const relationToId = elements.relationTo.value;
  let photo = "";

  // معالجة الصورة
  if (elements.photoInput.files.length > 0) {
    const file = elements.photoInput.files[0];
    photo = await readFileAsBase64(file);
  }

  let existing = members.find(m => m.id === id);
  if (existing) {
    existing.name = name;
    if (photo) existing.photo = photo;
  } else {
    const newMember = { id, name, parentId: null, spouseId: null, photo };

    // منطق العلاقات الصحيح
    if (relationToId && relationType) {
      const relative = members.find(m => m.id === relationToId);
      if (relative) {
        switch (relationType) {
          case "spouse":
            newMember.spouseId = relationToId;
            relative.spouseId = id;
            break;
          case "father":
          case "mother":
            relative.parentId = id;
            break;
          case "son":
          case "daughter":
            newMember.parentId = relationToId;
            break;
        }
      }
    }

    members.push(newMember);
  }

  closeModal();
  drawTree();
});

// قراءة الصورة كـ Base64
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// بناء الهيكل الهرمي
function buildTree(rootMember) {
  const children = members.filter(m => m.parentId === rootMember.id);
  return {
    ...rootMember,
    children: children.map(buildTree)
  };
}

// تحديد الجذر (أول شخص بدون parentId)
function getRoot() {
  return members.find(m => !m.parentId) || members[0];
}

// رسم الشجرة
function drawTree() {
  elements.svg.selectAll("*").remove();

  if (members.length === 0) {
    elements.svg.style("display", "none");
    elements.emptyState.style.display = "block";
    return;
  }

  elements.svg.style("display", "block");
  elements.emptyState.style.display = "none";

  const rootMember = getRoot();
  const root = d3.hierarchy(buildTree(rootMember));
  const treeLayout = d3.tree().size([800, 400]);
  treeLayout(root);

  const g = elements.svg.append("g").attr("transform", "translate(100,100)");

  // الروابط (الخطوط)
  g.selectAll(".link")
    .data(root.links())
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("fill", "none")
    .attr("stroke", "#999")
    .attr("stroke-width", 2)
    .attr("d", d3.linkVertical()
      .x(d => d.x)
      .y(d => d.y)
    );

  // العقد (الأفراد)
  const node = g.selectAll(".node")
    .data(root.descendants())
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .on("click", (event, d) => openContextMenu(event, d.data));

  node.append("circle")
    .attr("r", 40)
    .attr("fill", "#ffcc66")
    .attr("stroke", "#996600")
    .attr("stroke-width", 2);

  node.append("image")
    .attr("xlink:href", d => d.data.photo || "")
    .attr("x", -30)
    .attr("y", -30)
    .attr("width", 60)
    .attr("height", 60)
    .attr("clip-path", "circle(30px)");

  node.append("text")
    .attr("dy", "4em")
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("fill", "#333")
    .text(d => d.data.name);
}

// قائمة النقر على الأفراد
function openContextMenu(event, member) {
  event.preventDefault();
  selectedMember = member;

  elements.contextMenu.style.display = "block";
  elements.contextMenu.style.left = `${event.pageX}px`;
  elements.contextMenu.style.top = `${event.pageY}px`;
}

window.addEventListener("click", () => {
  elements.contextMenu.style.display = "none";
});
