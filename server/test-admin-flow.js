const mongoose = require('mongoose');
const User = require('./src/models/User');
const { ProviderProfile } = require('./src/models/ProviderProfile');

const API_URL = 'http://localhost:5001/api';
require('dotenv').config({ path: '../.env' });

const fetchAPI = async (method, path, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${API_URL}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const runTests = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Admin login
    const adminRes = await fetchAPI('POST', '/auth/login', {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    });
    const adminToken = adminRes.token;

    // Create a new provider
    const email = `prov${Date.now()}@example.com`;
    const provRes = await fetchAPI('POST', '/auth/register', {
      name: "Admin Target Prov",
      email,
      password: "password123"
    });
    const provToken = provRes.token;

    // 1. RBAC Test
    try {
      await fetchAPI('GET', '/admin/dashboard', null, provToken);
      console.log("FAIL: Provider accessed dashboard!");
    } catch (err) {
      console.log("1. Provider correctly blocked from admin API (403):", err.message);
    }

    try {
      await fetchAPI('GET', '/admin/dashboard');
      console.log("FAIL: Unauthenticated accessed dashboard!");
    } catch (err) {
      console.log("2. Unauthenticated correctly blocked from admin API (401):", err.message);
    }

    // 3. Dashboard counts
    const dash = await fetchAPI('GET', '/admin/dashboard', null, adminToken);
    console.log(`3. Dashboard stats: Total ${dash.data.total}, Draft ${dash.data.draft}`);

    // 4. Listing Pagination & Filters
    const list = await fetchAPI('GET', '/admin/providers?page=1&limit=5&status=draft', null, adminToken);
    console.log(`4. Pagination success: total ${list.data.pagination.total}, returned ${list.data.providers.length}`);

    const user = await User.findOne({ email });

    // 5. Malformed ID Detail
    try {
      await fetchAPI('GET', '/admin/providers/invalid-id', null, adminToken);
      console.log("FAIL: Malformed ID succeeded!");
    } catch (err) {
      console.log("5. Malformed ID correctly rejected (400):", err.message);
    }

    // 6. Non-existent ID Detail
    try {
      await fetchAPI('GET', `/admin/providers/${new mongoose.Types.ObjectId()}`, null, adminToken);
      console.log("FAIL: Non-existent ID succeeded!");
    } catch (err) {
      console.log("6. Non-existent ID correctly rejected (404):", err.message);
    }

    // 7. Invalid Transitions (draft -> approved)
    try {
      await fetchAPI('PATCH', `/admin/providers/${user._id}/approve`, null, adminToken);
      console.log("FAIL: Draft approved!");
    } catch (err) {
      console.log("7. Draft -> Approved correctly blocked (400):", err.message);
    }

    // Move to pending for tests
    await fetchAPI('PUT', '/providers/me', { 
      phone: "1234567890",
      experience: 2, 
      categories: ["Electrical"],
      skills: ["Wiring"],
      serviceLocation: { address: "123", city: "A", state: "B", pincode: "123456" }
    }, provToken);
    await fetchAPI('POST', '/providers/me/submit', null, provToken);

    // 8. Rejection Validation (Empty Remark)
    try {
      await fetchAPI('PATCH', `/admin/providers/${user._id}/reject`, { rejectionRemark: "   " }, adminToken);
      console.log("FAIL: Whitespace remark accepted!");
    } catch (err) {
      console.log("8. Empty/whitespace rejection remark correctly blocked (400):", err.message);
    }

    // 9. Rejection Protected Payload Injection
    try {
      await fetchAPI('PATCH', `/admin/providers/${user._id}/reject`, {
        rejectionRemark: "Invalid ID",
        status: "approved",
        role: "admin"
      }, adminToken);
      
      const checkUser = await User.findById(user._id);
      if (checkUser.status === 'approved' || checkUser.role === 'admin') {
        console.log("FAIL: Protected fields modified!");
      } else {
        console.log("9. Rejection succeeded and protected payload ignored.");
      }
    } catch (err) {
      console.log("FAIL: Rejection failed:", err.message);
    }

    // Move back to pending
    await fetchAPI('POST', '/providers/me/submit', null, provToken);

    // 10. Race Condition (Two concurrent approvals)
    console.log("10. Simulating Race Condition (2 concurrent approve requests)...");
    const p1 = fetchAPI('PATCH', `/admin/providers/${user._id}/approve`, null, adminToken);
    const p2 = fetchAPI('PATCH', `/admin/providers/${user._id}/approve`, null, adminToken);

    const results = await Promise.allSettled([p1, p2]);
    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.filter(r => r.status === 'rejected').length;
    console.log(`Race Condition Results: ${successes} Success, ${failures} Failure(s).`);
    if (successes === 1 && failures === 1) {
      console.log("Race condition cleanly prevented (409)!");
    } else {
      console.log("FAIL: Race condition prevention failed.");
    }

  } catch (err) {
    console.error("Test failed globally:", err.message);
  } finally {
    mongoose.connection.close();
  }
};

runTests();
