const mongoose = require('mongoose');
const User = require('./src/models/User');
const { ProviderProfile } = require('./src/models/ProviderProfile');

const API_URL = 'http://127.0.0.1:5001/api';
require('dotenv').config({ path: './.env' });

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

    const email = `testflow${Date.now()}@example.com`;
    
    // 1. Register
    const regRes = await fetchAPI('POST', '/auth/register', {
      name: "Test Flow",
      email,
      password: "password123"
    });
    const token = regRes.token;

    console.log("1. Registration successful.");

    // 2. Update Profile to Complete
    await fetchAPI('PUT', '/providers/me', {
      phone: "1234567890",
      categories: ["Cleaning"],
      skills: ["General"],
      experience: 5,
      serviceLocation: { address: "123", city: "A", state: "B", pincode: "123456" }
    }, token);
    console.log("2. Profile update (draft) successful.");

    // 3. Submit (draft -> pending)
    await fetchAPI('POST', '/providers/me/submit', {}, token);
    console.log("3. Submit (draft -> pending) successful.");

    // 4. Try submit again
    try {
      await fetchAPI('POST', '/providers/me/submit', {}, token);
      console.log("FAIL: Was able to submit while pending.");
    } catch (err) {
      console.log("4. Resubmit rejected correctly (403):", err.message);
    }

    // 5. Try edit while pending
    try {
      await fetchAPI('PUT', '/providers/me', { phone: "000" }, token);
      console.log("FAIL: Was able to edit while pending.");
    } catch (err) {
      console.log("5. Edit while pending rejected correctly (403):", err.message);
    }

    // 6. Force to approved
    const user = await User.findOne({ email });
    user.status = 'approved';
    await user.save();
    console.log("6. Forcefully set status to approved.");

    // 7. Try submit while approved
    try {
      await fetchAPI('POST', '/providers/me/submit', {}, token);
      console.log("FAIL: Was able to submit while approved.");
    } catch (err) {
      console.log("7. Submit while approved rejected correctly (403):", err.message);
    }

    // 8. Force to rejected with remark
    user.status = 'rejected';
    await user.save();
    const profile = await ProviderProfile.findOne({ userId: user._id });
    profile.rejectionRemark = "Needs better address proof";
    await profile.save();
    console.log("8. Forcefully set status to rejected with remark.");

    // 9. Fetch status to verify
    const statusRes = await fetchAPI('GET', '/providers/me/status', null, token);
    console.log(`9. Fetched status: ${statusRes.data.status}, remark: ${statusRes.data.rejectionRemark}`);

    // 10. Edit profile while rejected
    await fetchAPI('PUT', '/providers/me', { experience: 6 }, token);
    console.log("10. Edit while rejected successful.");

    // 11. Security Payload Check
    try {
      await fetchAPI('PUT', '/providers/me', { status: "approved", rejectionRemark: "hacked" }, token);
      console.log("FAIL: Security payload allowed protected fields to be mutated!");
    } catch (err) {
      console.log("11. Security payload correctly rejected (400):", err.message);
    }

    // 12. Submit (rejected -> pending)
    await fetchAPI('POST', '/providers/me/submit', {}, token);
    console.log("12. Submit (rejected -> pending) successful.");

    // 13. Verify remark cleared
    const finalStatusRes = await fetchAPI('GET', '/providers/me/status', null, token);
    if (finalStatusRes.data.rejectionRemark === null) {
      console.log("13. Rejection remark cleanly cleared after resubmission.");
    } else {
      console.log("FAIL: Rejection remark was not cleared.");
    }

  } catch (err) {
    console.error("Test failed:", err.message);
  } finally {
    mongoose.connection.close();
  }
};

runTests();
