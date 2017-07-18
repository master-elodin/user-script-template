function Page() {
    var instance = this;

    var REFRESH_INTERVAL_MILLIS = 300000;

    instance.scriptVersion = ko.observable(SCRIPT_VERSION);

    instance.editMode = ko.observable(false);
    instance.editMode.subscribe(function(newVal) {
        if(!newVal) {
            instance.save();
        }
    });
    instance.toggleEdit = createToggle(instance.editMode);
    instance.cancelEdit = function() {
        instance.load();
        instance.editMode(false);
    }

    instance.showHostGroupHealth = ko.pureComputed(function() {
        return instance.showRefreshIcon() && !instance.activeService();
    });

    instance.showServiceActions = ko.pureComputed(function() {
        return instance.showRefreshIcon() && instance.activeService();
    });

    instance.showRefreshIcon = ko.pureComputed(function() {
        return !!instance.activeHostGroup() && !instance.editMode();
    });

    instance.activeApp = ko.observable();
    instance.activeEnv = ko.observable();
    instance.activeHostGroup = ko.observable();
    instance.activeHosts = ko.observableArray();
    instance.activeService = ko.observable();
    instance.clearAllActive = function() {
        var clearIsActive = function(observable) {
            if(observable()) {
                observable().isActive(false);
            }
            observable(null);
        }
        clearIsActive(instance.activeApp);
        clearIsActive(instance.activeEnv);
        clearIsActive(instance.activeHostGroup);
        instance.activeHosts([]);
        instance.activeServices([]);
        instance.activeService(null);
    };

    instance.selectService = function(service) {
        if(instance.startStopUnlocked()) {
            instance.activeHostGroup().getChildrenNames().forEach(function(hostName) {
                service.getFirstInstanceForHost(hostName).selected(true);
            });
        } else {
            instance.activeService(service);
        }
    };

    instance.noHostsConfigured = ko.pureComputed(function() {
        return instance.activeHostGroup() && instance.activeHostGroup().children().length === 0;
    });

    var setActiveState = function(activeHolder, newActive) {
        if(activeHolder()) {
            activeHolder().isActive(false);
        }
        newActive.isActive(true);
        activeHolder(newActive);
        instance.filterValue("");
    };

    instance.activateItem = function(item) {
        if(!instance.editMode()) {
            if(item.childrenType === Item.ChildrenTypes.ENV) {
                instance.clearAllActive();
                setActiveState(instance.activeApp, item);
            } else if(item.childrenType === Item.ChildrenTypes.HOST_GROUP) {
                instance.clearAllActive();
                setActiveState(instance.activeApp, item.parent);
                setActiveState(instance.activeEnv, item);
                document.title = item.name();
            } else if(item.childrenType === Item.ChildrenTypes.HOST) {
                instance.activeService(null);
                if(item !== instance.activeHostGroup()) {
                    instance.clearAllActive();
                    setActiveState(instance.activeApp, item.parent.parent);
                    setActiveState(instance.activeEnv, item.parent);
                    setActiveState(instance.activeHostGroup, item);
                    instance.activeHosts(item.getChildrenNames());
                    document.title = item.parent.name() + " " + item.name();
                }
            }
            instance.save();
        }
    }

    instance.pageData = new Item({name: "configuration", childrenType: "applications", applications: []});
    instance.pageData.scriptVersion = SCRIPT_VERSION;
    var getSettingsAsJsonText = function() {
        return JSON.stringify(instance.pageData.export());
    };

    instance.save = function() {
        var settingsAsJsonText = getSettingsAsJsonText();
        localStorage.setItem(Page.DATA_NAME, settingsAsJsonText);
        console.log("Saved page data as JSON", instance.pageData.export());
    };

    var defaultListIfNull = function(list) {
        return list || [];
    }

    instance.load = function() {
        var existingData = JSON.parse(localStorage.getItem(Page.DATA_NAME) || "{}");
        if(existingData.applications) {
            console.log("Adding children types...");
            existingData.childrenType = Item.ChildrenTypes.APP;
            existingData.name = "configuration";
            existingData.applications.forEach(function(app) {
                app.childrenType = Item.ChildrenTypes.ENV;
                defaultListIfNull(app.environments).forEach(function(env) {
                    env.childrenType = Item.ChildrenTypes.HOST_GROUP;
                    defaultListIfNull(env.hostGroups).forEach(function(hostGroup) {
                        hostGroup.childrenType = Item.ChildrenTypes.HOST;
                    });
                });
            });
            console.log("Loading data", existingData);
            instance.pageData.import(existingData);
            var activateItems = function(item) {
                if(item.isActive()) {
                    instance.activateItem(item);
                }
                item.children().forEach(function(child) {
                    activateItems(child);
                });
            }
            activateItems(instance.pageData);
            console.log("Page data after load", instance.pageData.export());
            instance.editMode(false);
        } else {
            console.log("Tried to load but no valid existing data found", existingData);
            console.log("Using page data:", instance.pageData.export());
            instance.editMode(true);
        }
    };

    instance.activeServices = ko.observableArray();
    instance.servicesByHostGroupId = {};
    instance.filterValue = ko.observable("");
    instance.getServicesForActiveHostGroup = ko.pureComputed(function() {
        return instance.activeServices().filter(function(service) {
            return instance.filterValue().toLowerCase().split(" ").every(function(filterPart) {
                return service.name.toLowerCase().indexOf(filterPart) > -1;
            });
        });
    });
    instance.activeHostGroup.subscribe(function(newVal) {
        if(newVal) {
            instance.refresh();
        }
    });

    instance.pageMessage = ko.observable();
    var setMessage = function(msg) {
        instance.pageMessage(msg);
    };

    instance.clearMessage = function() {
        if(instance.pageMessage()) {
            instance.pageMessage().visible(false);
        }
    };

    instance.addServiceData = function(serviceList) {
        var activeGroupId = instance.activeHostGroup().getId();
        if(!instance.servicesByHostGroupId[activeGroupId]) {
            instance.servicesByHostGroupId[activeGroupId] = [];
        }
        var existingServiceList = instance.servicesByHostGroupId[activeGroupId];
        serviceList.forEach(function(newService) {
            var existingService = existingServiceList.find(function(existingService) {
                return newService.name === existingService.name;
            });
            if(existingService) {
                existingService.merge(newService);
            } else {
                existingServiceList.push(newService);
            }
        });

        existingServiceList.sort(function(a, b) {
            return sortStrings(a.name, b.name);
        });
        instance.activeServices(existingServiceList);

        instance.clearMessage();
        instance.refreshMessage("Last successful refresh: " + formatTime(new Date(), "HH:mm"));
    };

    setInterval(function() {
        instance.refresh();
    }, REFRESH_INTERVAL_MILLIS);
    instance.isRefreshing = ko.observable(false);
    instance.refreshMessage = ko.observable();
    instance.refresh = function() {
        if(!instance.isRefreshing() && instance.activeHostGroup()) {
            instance.isRefreshing(true);
            Data.getDataForHosts(instance.activeHostGroup().getChildrenNames())
            .then(instance.addServiceData)
            .fail(function(error) {
                setMessage(new Message({text: error.error, type: Message.Type.ERROR}));
            }).always(function() {
                instance.isRefreshing(false);
            });
        }
    };

    instance.downloadConfig = function() {
        downloadAsFile(getSettingsAsJsonText(), "service-config");
    };

    instance.uploadConfig = function() {
        uploadFile(function(configText) {
            localStorage.setItem(Page.DATA_NAME, configText);
            instance.load();
        });
    };

    // must be declared after activeServices exists
    instance.serviceController = new ServiceController({activeServices: instance.activeServices, activeHostGroup: instance.activeHostGroup});
    instance.startStopUnlocked = instance.serviceController.startStopUnlocked;
};

Page.DATA_NAME = "all-data";