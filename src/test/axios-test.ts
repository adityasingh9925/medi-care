import axios from "axios";

async function testAxios() {
  try {
    const response = await axios.get("http://localhost:5000/health");
    console.log("Axios request works");
    console.log("Response:", response.data);
  } catch (error) {
    console.log("Axios request failed");
    console.error(error);
  }
}

testAxios();