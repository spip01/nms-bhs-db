class totals {
    total = 0;
    platform = [{
        "PC-XBox": 0,
        "PS4": 0
    }];

    incTotals(i, p) {
        total += i;
        platform[p] += i;
    };
}

class grandTotals {
    total = new totals;
    users;
    orgs;

    incTotals(i, platform, user, org) {
        total.incTotals(i, platform);
        users[user].incTotals(i, platform);
        orgs[org].incTotals(i, platform);
    }
}

let stars = class {
    totals = new grandTotals;

    incTotals(i, platform, user, org) {
        totals.incTotals(i, platform, user, org);
    }
}

class galaxy {
    constructor(name) {
        this._name = name;
    }
    totals = new grandTotals;
}

class base {
    constructor(name, uid) {
        this._name = name;
        this.uid = uid;
    }
    _name;
    uid;
    created;
    modded;
}

class user extends base {
    galaxy;
    platform;
}

class addr extends user {
    addr;
    connection = "";

    blackhole = false;
    deadzone = false;
    exit = false;
    base = false;

    sys = "";
    reg = "";
    life = "";
    econ = "";
    sun = "";

    dist = 0;
    toCtr = 0;
}

class org {
    constructor(name) {
        this._name = name;
    }
}

let contest = class {
    constructor(name) {
        _name = name;
    }
    start;
    end;

    total = new grandTotals;
}

