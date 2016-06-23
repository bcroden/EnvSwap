function isHttp(url) {
    return /^http:/.test(url);
}

function isHttps(url) {
    return /^https:/.test(url);
}

function isOther(url) {
    return !/^http(s)?:/.test(url);
}

function toHttp(url) {
    if (isHttp(url) || isOther(url))
        return url;
    return url.replace(/^https:/, 'http:');
}

function toHttps(url) {
    if (isHttps(url) || isOther(url))
        return url;
    return url.replace(/^http:/, 'https:');
}

function convertSecure(url) {
    if (isHttp(url))
        return toHttps(url);
    else if (isHttps(url))
        return toHttp(url);
}

function switchTo(targetEnv, sites, envs) {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => {
        let tab = tabs[0];
        let oldUrl = tab.url;

        sites.some(site => {
            return envs.some(env => {
                if (oldUrl.includes(site[env])) {
                    var newUrl = oldUrl.replace(site[env], site[targetEnv]);

                    chrome.tabs.update(tab.id, {
                        url: newUrl
                    })

                    return true;
                }
            });
        });
    });
}

function toggleSecure() {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => {
        let tab = tabs[0];
        let oldUrl = tab.url;

        if (isOther(oldUrl)) return;

        let newUrl = convertSecure(oldUrl);

        chrome.tabs.update(tab.id, {
            url: newUrl
        });
    });
}

function updateHttpsSwitch() {
    let $secureSwitch = document.getElementById('secure-switch');
    
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => {
        let tab = tabs[0];

        var event = new MouseEvent('click', {
            'view': window,
            'bubbles': true,
            'cancelable': true
        });

        if(isHttps(tab.url) && $secureSwitch.checked)
            ;
        if(isHttps(tab.url) && !$secureSwitch.checked)
            $secureSwitch.dispatchEvent(event);
        if(isHttp(tab.url) && $secureSwitch.checked)
            $secureSwitch.dispatchEvent(event);
        else
            ;
    });
}

function getButtonHtml(name) {
    return `
        <div class="mdl-cell mdl-cell--12-col">
            <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored mdl-js-ripple-effect" id="button-${name}">${name}</button>
        </div>
    `;
}

function getSwitchHtml() {
    return `
        <div class="mdl-cell mdl-cell--12-col">
            <label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="secure-switch">
                <input type="checkbox" id="secure-switch" class="mdl-switch__input">
                <span class="mdl-switch__label">HTTPS</span>
            </label>
        </div>
    `;
}

chrome.storage.sync.get('data', data => {
    data = (data && data.data) ? data.data : {
        envs: [],
        sites: []
    };

    // Create buttons for each env
    let $container = document.getElementById('container');
    data.envs.forEach(env => $container.innerHTML += getButtonHtml(env));
    $container.innerHTML += getSwitchHtml();

    // Wire event listeners to each button
    data.envs.forEach(env => {
        let $btn = document.getElementById(`button-${env}`);
        $btn.onclick = () => switchTo(env, data.sites, data.envs);
    });

    // Wire event listener to https switch
    let $secureSwitch = document.getElementById('secure-switch');
    $secureSwitch.onclick = event => {
        if(event.isTrusted)
            toggleSecure();
    }

    updateHttpsSwitch();
    setInterval(updateHttpsSwitch, 1000);

    componentHandler.upgradeAllRegistered();
});
