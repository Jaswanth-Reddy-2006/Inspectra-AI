async function testScan() {
    try {
        console.log('Sending scan request to localhost:5000...');
        const response = await fetch('http://localhost:5000/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://dealdrop-lj35.onrender.com/' })
        });
        const data = await response.json();
        if (response.ok) {
            console.log('Scan Success:', JSON.stringify(data, null, 2).slice(0, 500) + '...');
        } else {
            console.error('Scan Failed:', data);
        }
    } catch (error) {
        console.error('Network Error:', error.message);
    }
}

testScan();
