/* jshint -W097 */ // jshint strict:false
/*jslint node: true */

"use strict";
var utils = require('@iobroker/adapter-core'); // Get common adapter utils
var request = require('request');
var lang = 'de';
var callReadPrinter;
var ip = '';
var baselevel = 50; // bedeutet: in der Webseite wird ein Balken von 100% Höhe 50px hoch gezeichnet. 
                    // Also entspricht ein gezeigtes Tintenlevel von 25 (px) dann 50% und eines von 10 (px) dann 20%
var link = '';
var sync = 180;

var adapter = utils.Adapter({
    name: 'epson_stylus_px830',
    systemConfig: true,
    useFormatDate: true,
    /*stateChange: function(id, state) {
        if (!id || !state || state.ack) return;
        //if ((!id.match(/\.level\w*$/) || (!id.match(/\.cid\w*$/)) return; // if datapoint is not "level" or not "cid"
        adapter.log.debug('stateChange ' + id + ' ' + JSON.stringify(state));
        adapter.log.debug('input value: ' + state.val.toString());
        //controlPrinter(id, state.val.toString()); // Probably Shutdown or Wakeup command
    },*/
    unload: function(callback) {
        try {
            adapter.log.info('terminating epson printer adapter');
            stopReadPrinter();
            callback();
        } catch (e) {
            callback();
        }
    },
    ready: function() {
        adapter.log.debug('initializing objects');
        main();
    }
});


var ink = {
    'cyan' : {
        'state': 'cyan',
        'name': 'Cyan',
        'cut':  'IMAGE/Ink_C.PNG" height=',
        'cartridge': 'T0802'    
    },
    'cyanlight' : {
        'state': 'cyanlight',
        'name': 'Cyan Light',
        'cut':  'IMAGE/Ink_LC.PNG" height=',
        'cartridge': 'T0805'    
    },
    'yellow' : {
        'state': 'yellow',
        'name': 'Yellow',
        'cut':  'IMAGE/Ink_Y.PNG" height=',
        'cartridge': 'T0804'    
    },
    'black' : {
        'state': 'black',
        'name': 'Black',
        'cut':  'IMAGE/Ink_K.PNG" height=',
        'cartridge': 'T0801'    
    },
    'magenta' : {
        'state': 'magenta',
        'name': 'Magenta',
        'cut':  'IMAGE/Ink_M.PNG" height=',
        'cartridge': 'T0803'    
    },
    'magentalight' : {
        'state': 'magentalight',
        'name': 'Magenta Light',
        'cut':  'IMAGE/Ink_LM.PNG" height=',
        'cartridge': 'T0806'    
    }
};

function readSettings() {
    //check if IP is entered in settings
    
    if (!adapter.config.printerip) {
        adapter.log.warn('No IP adress of printer set up. Adapter will be stopped.');
        //stopReadPrinter();
    } 
    else { // ip entered
        ip = (adapter.config.printerport.length > 0) ? adapter.config.printerip + ':' + adapter.config.printerport : adapter.config.printerip; // if port is set then ip+port else ip only
        adapter.log.debug('IP: ' + ip);
        link = 'http://' + ip + '/PRESENTATION/HTML/TOP/PRTINFO.HTML';
    
        //check if sync time is entered in settings
        sync = (!adapter.config.synctime) ? 180 : parseInt(adapter.config.synctime,10);
        adapter.log.debug('ioBroker reads printer every ' + sync + ' minutes');

    } // end ip entered
}

function readPrinter() {

    var name_cut = 'Druckername&nbsp;:&nbsp;',
        name_cut2 = 'Verbindungsstatus',
        connect_cut = 'Verbindungsstatus&nbsp;:&nbsp;',
        connect_cut2 = 'IP-Adresse beziehen',
        model_cut = '<title>',
        model_cut2 = '</title>',
        mac_cut = 'MAC-Adresse&nbsp;:&nbsp;',
        mac_cut2 = '</textarea>',
        message_cut = "<div class='message' id='message_id' style='direction:ltr; unicode-bidi:bidi-override;'>",
        message_cut2 = "</div><form method";
 
    adapter.setState('ip', {
        val: ip,
        ack: false
    });
 
    /* evtl. adapter.setState('UNREACH', {
                    val: true,
                    ack: false
                });*/
    var unreach = true;
    request(link, function(error, response, body) {
        if (!error && response.statusCode === 200) {
        
            unreach = false;
            adapter.setState('ip', {
                val: ip,
                ack: true
            });
             // NAME EINLESEN
            var name_cut_position = body.indexOf(name_cut) + name_cut.length,
                name_cut2_position = body.indexOf(name_cut2) - 1;
            var name_string = body.substring(name_cut_position, name_cut2_position);
            adapter.setState('name', {val: name_string, ack: true});  
            
            // MODELL EINLESEN
            var model_cut_position = body.indexOf(model_cut) + model_cut.length,
                model_cut2_position = body.indexOf(model_cut2);
            var model_string = body.substring(model_cut_position, model_cut2_position);
            adapter.setState('model', {val: model_string, ack: true});  
            
            // MAC ADRESSE EINLESEN
            var mac_cut_position = body.indexOf(mac_cut) + mac_cut.length,
                mac_cut2_position = body.indexOf(mac_cut2) - 1;
            var mac_string = body.substring(mac_cut_position, mac_cut2_position);
            adapter.setState('mac', {val: mac_string, ack: true});     
        
            // CONNECTION EINLESEN
            var connect_cut_position = body.indexOf(connect_cut) + connect_cut.length,
                connect_cut2_position = body.indexOf(connect_cut2) - 1;
            var connect_string = body.substring(connect_cut_position, connect_cut2_position);
            adapter.setState('connect', {val: connect_string, ack: true});   

            for (var i in ink) {
               adapter.setObjectNotExists('inks.' + ink[i].state + '.level', {
                    type: 'state',
                    common: {
                        name: 'Level of ' + ink[i].name,
                        desc: 'Level of ' + ink[i].name,
                        type: 'number',
                        unit: '%',
                        read: true,
                        write: false
                    },
                    native: {}
                });
                // create state with ink name + cartrigde
                adapter.setObjectNotExists('inks.' + ink[i].state + '.cartridge', {
                    type: 'state',
                    common: {
                        name: 'Cartridge name for ' + ink[i].name,
                        desc: 'Cartridge name for ' + ink[i].name,
                        type: 'string',
                        def:  ink[i].cartrigde,
                        read: true,
                        write: false
                    },
                    native: {}
                });
                // ggf. erstellen bestätigen
           
                // read levels
            
                var cut_position = body.indexOf(ink[i].cut) + ink[i].cut.length + 1;
                var level_string = body.substring(cut_position, cut_position + 2);
                //adapter.log.debug(ink[i].name + ' Levelstring: ' + level_string + 'px');
                var level = parseInt(level_string,10) * 100 / parseInt(baselevel,10);
                adapter.setState('inks.' + ink[i].state + '.level', {val: level, ack: true});
                adapter.setState('inks.' + ink[i].state + '.cartridge', {val: ink[i].cartridge, ack: true});
                adapter.log.debug(ink[i].name + ' Level: ' + level + '%');
            } // end for
            
            adapter.log.debug('Channels and states created/read');
            
        } else {
            adapter.log.warn('Cannot connect to Printer: ' + error);
            unreach = true;
        }
        // Write connection status
        adapter.setState('UNREACH', {
            val: unreach,
            ack: true
        });
    }); // End request 
    adapter.log.debug('finished reading printer Data');
}

function stopReadPrinter() {
    clearInterval(callReadPrinter);
    adapter.log.info('Epson Stylus PX830 adapter stopped');
}

function main() {
    //adapter.subscribeStates('*'); 
    readSettings();
    adapter.log.debug('Epson Stylus PX830 adapter started...');
    readPrinter();
    callReadPrinter = setInterval(function() {
        adapter.log.debug('connecting printer webserver ...');
        readPrinter();
    }, sync * 1000 * 60);
}
