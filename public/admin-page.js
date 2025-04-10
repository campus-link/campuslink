document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return showAccessDenied();

    verifyAdmin(token);
    fetchUsers();

    document.getElementById("userForm").addEventListener("submit", handleFormSubmit);
});

// ✅ Admin Verification
async function verifyAdmin(token) {
    try {
        const res = await fetch("http://localhost:5000/admin/verify", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        console.log("✅ Admin Verified:", data.message);
    } catch (err) {
        console.error("❌ Verification Error:", err.message);
        localStorage.removeItem("adminToken");
        showAccessDenied();
    }
}

// ✅ Show Access Denied
function showAccessDenied() {
    document.body.innerHTML = "<h2>❌ Access Denied. Please <a href='admin.html'>Login</a>.</h2>";
}

// ✅ Logout
function logout() {
    localStorage.removeItem("adminToken");
    window.location.href = "admin.html";
}

// ✅ Fetch Users
async function fetchUsers(role = "all") {
    try {
        const res = await fetch("http://localhost:5000/users");
        const users = await res.json();

        const filteredUsers = role === "all" ? users : users.filter(user => user.role === role);
        const tbody = document.getElementById("userTableBody");
        tbody.innerHTML = "";

        filteredUsers.forEach(user => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.password}</td> <!-- ✅ Password shown correctly -->
                <td>${user.role}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick='editUser(${JSON.stringify(user)})'>✏️ Edit</button>
                    <button class="btn btn-sm btn-danger ms-1" onclick='deleteUser(${user.id})'>🗑️ Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("❌ Error fetching users:", err.message);
    }
}

// ✅ Add / Update User
async function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById("userId").value;
    const name = document.getElementById("userName").value;
    const email = document.getElementById("userEmail").value;
    const role = document.getElementById("userRole").value;
    const password = document.getElementById("userPassword").value;

    if (!name || !email || !role || (!id && !password)) {
        alert("Please fill in all required fields");
        return;
    }

    const payload = { name, email, role };
    if (password) payload.password = password;

    const url = id ? `http://localhost:5000/users/${id}` : "http://localhost:5000/users";
    const method = id ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        console.log("✅ User saved:", data);
        hideUserForm();
        fetchUsers();
    } catch (err) {
        console.error("❌ Save failed:", err.message);
        alert("Save failed: " + err.message);
    }
}


// ✅ Show Add Form
function showAddUserForm() {
    document.getElementById("userFormContainer").style.display = "block";
    document.getElementById("userForm").reset();
    document.getElementById("userId").value = "";
}

// ✅ Hide Form
function hideUserForm() {
    document.getElementById("userFormContainer").style.display = "none";
}

// ✅ Populate Form for Editing
function editUser(user) {
    showAddUserForm();
    document.getElementById("userId").value = user.id;
    document.getElementById("userName").value = user.name;
    document.getElementById("userEmail").value = user.email;
    document.getElementById("userRole").value = user.role;
    document.getElementById("userPassword").value = user.password;
}

// ✅ Delete User
async function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
        const res = await fetch(`http://localhost:5000/users/${id}`, {
            method: "DELETE"
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        console.log("✅ User deleted:", data);
        fetchUsers();
    } catch (err) {
        console.error("❌ Delete failed:", err.message);
    }
}

// ✅ Filter by Role
function filterUsers(role) {
    console.log("Filter triggered for:", role);
    fetchUsers(role);
}
