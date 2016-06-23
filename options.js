function saveChanges() {
    let $inputText = document.getElementById('inputText');
    let $error = document.getElementById('error');

    let value = $inputText.value || "{}";
    
    try {
        let jsonValue = JSON.parse(value);
        $error.style.display = "none";

        chrome.storage.sync.set({data: jsonValue});
    }
    catch (e) {
        $error.style.display = "inline";
    }
}

let $inputText = document.getElementById('inputText');

chrome.storage.sync.get('data', data => $inputText.value = JSON.stringify((data && data.data) ? data.data : {
    envs: [],
    sites: []
}));

document.getElementById("saveBtn").onclick = () => saveChanges();
