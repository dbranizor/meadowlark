let config = {};

const logger = (config = { logging: "debug" }) =>
    config.logging === "debug" ? console.log : () => {};

const makeClientId = (uuid) => {
    return uuid().replace(/-/g, "").slice(-16);
};

class RestClient {
    logger;
    constructor(config) {
        this.logger = logger(config);
        Object.keys(config).forEach((key) => (this[key] = config[key]));
    }
    json;

    async get(url) {
        this.logger("Running Get Fetch ", url);
        const status = await fetch(computeUrl.call(this, url));
        this.logger("Running Get Error Handling");
        errorHandling(status);
        this.logger("Get Error Handling Completed. Sending Response");
        this.json = await status.json();
        this.logger("Get Response", this.json);
        return this.json;
    }
    async delete(url) {
        const status = await fetch(computeUrl.call(this, url), {
            method: "DELETE",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
        });
        errorHandling(status);
        return true;
    }
    async post(url, params) {
        this.logger("Running Post Error Handling");
        const status = await fetch(computeUrl.call(this, url), {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            body: JSON.stringify({ ...params }),
        });
        this.logger("Running Post Error Handling");
        errorHandling(status);
        this.logger(
            "Post Error Handling Completed. Sending Response",
            status,
            this.json
        );
        this.json = await status.json();
        this.logger("Get Response", this.json);
        return this.json;
    }
    async put(url, params) {
        this.logger("Running Put Fetch ", url);
        const computedUrl = computeUrl.call(this, url);
        const status = await fetch(computedUrl, {
            method: "PUT",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            body: JSON.stringify({ ...params }),
        });
        this.logger("Running Put Error Handling");
        errorHandling(status);
        this.logger(
            "Put Error Handling Completed. Sending Response",
            status,
            this.json
        );
        try {
            this.json = await status.json();
        } catch (error) {
            console.error("Failed Getting JSON From Response ", error);
        }

        return this.json;
    }
}

function computeUrl(url) {
    return this.mode
        ? `${this.syncHost}/${this.mode}${url}`
        : `${this.syncHost}/${url}`;
}

const errorHandling = (status) => {
    if (!status.ok) {
        throw Error(status.statusText);
    }
};

export { RestClient, logger, makeClientId };
