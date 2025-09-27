# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

This adapter specifically monitors ink levels and printer status for Epson Stylus PX830 printers via HTTP communication. It polls the printer's internal web interface to extract information about ink levels, printer name, model, MAC address, and connection status.

## Adapter-Specific Context
- **Adapter Name**: epson_stylus_px830
- **Primary Function**: Monitor ink levels and status of Epson Stylus PX830 printers
- **Communication Method**: HTTP requests to printer's internal web server (default port 80)
- **Key Dependencies**: 
  - `request` library for HTTP communication with printer
  - `@iobroker/adapter-core` for ioBroker adapter functionality
- **Configuration Requirements**: 
  - Printer IP address (required)
  - Optional printer port (defaults to 80)
  - Sync time interval in minutes (defaults to 180)
- **Data Extraction**: Parses HTML responses to extract ink levels and printer information
- **Polling Mechanism**: Configurable interval-based polling (default 3 hours)

## HTTP Communication Patterns

When working with this adapter, understand these specific patterns:

### Printer Web Interface Access
```javascript
// Typical URL pattern for Epson printers
const link = 'http://' + ip + '/PRESENTATION/HTML/TOP/PRTINFO.HTML';

// Error handling for network issues
request(link, function(error, response, body) {
    if (!error && response.statusCode === 200) {
        // Parse HTML content
    } else {
        // Set printer as unreachable
        adapter.setState('UNREACH', {val: true, ack: true});
    }
});
```

### HTML Parsing for Ink Levels
```javascript
// Typical parsing pattern for extracting data from HTML
var name_cut = 'Druckername&nbsp;:&nbsp;';
var name_cut2 = 'Verbindungsstatus';
var name_cut_position = body.indexOf(name_cut) + name_cut.length;
var name_cut2_position = body.indexOf(name_cut2) - 1;
var name_string = body.substring(name_cut_position, name_cut2_position);
```

### State Management
```javascript
// Setting adapter states with proper acknowledgment
adapter.setState('name', {val: name_string, ack: true});
adapter.setState('ip', {val: ip, ack: true});
adapter.setState('UNREACH', {val: false, ack: true});
```

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Place test files in the `test/` directory
- Follow the naming pattern `*.test.js`
- Use the `@iobroker/testing` library for adapter-specific test utilities

Example test structure:
```javascript
const { tests } = require('@iobroker/testing');

// Test the adapter startup behavior
tests.integration(path.join(__dirname, '..'));
```

### Integration Testing
- Test with actual printer hardware when possible
- Mock HTTP responses for automated testing
- Validate state updates and error handling
- Test configuration validation and IP connectivity

### Package Validation
- Run `npm run test:package` to validate package.json and io-package.json structure
- Ensure all ioBroker metadata is correctly configured

## Error Handling

### Network Error Patterns
```javascript
// Handle printer connectivity issues
if (error || response.statusCode !== 200) {
    adapter.log.warn('Unable to connect to printer: ' + error);
    adapter.setState('UNREACH', {val: true, ack: true});
    return;
}
```

### Configuration Validation
```javascript
// Validate required configuration
if (!adapter.config.printerip) {
    adapter.log.warn('No IP address of printer set up. Adapter will be stopped.');
    return;
}
```

### HTML Parsing Error Handling
```javascript
// Robust parsing with error checking
try {
    var inkLevel = parseInt(extractedValue, 10);
    if (isNaN(inkLevel)) {
        adapter.log.warn('Invalid ink level data received');
        inkLevel = 0;
    }
} catch (error) {
    adapter.log.error('Error parsing ink level: ' + error);
}
```

## Configuration Management

### Admin Interface
- Uses both classic (`admin/index.html`) and Material Design (`admin/index_m.html`) interfaces
- Configuration stored in `adapter.config` object
- Key settings: printerip, printerport, synctime

### Default Values
```javascript
// Apply sensible defaults
ip = (adapter.config.printerport.length > 0) ? 
     adapter.config.printerip + ':' + adapter.config.printerport : 
     adapter.config.printerip;
sync = (!adapter.config.synctime) ? 180 : parseInt(adapter.config.synctime, 10);
```

## Development Guidelines

### State Object Structure
- Use channels for grouping related states (e.g., 'inks' channel)
- Implement proper state definitions in io-package.json
- Follow ioBroker naming conventions for state IDs

### Logging Best Practices
```javascript
adapter.log.debug('Detailed information for debugging');
adapter.log.info('General operational information');
adapter.log.warn('Warning conditions that need attention');
adapter.log.error('Error conditions that prevent normal operation');
```

### Resource Cleanup
```javascript
// Proper cleanup in unload method
function unload(callback) {
    if (callReadPrinter) {
        clearInterval(callReadPrinter);
        callReadPrinter = null;
    }
    callback();
}
```

## Code Style and Standards

- Use JSHint/ESLint configuration from `.eslintrc.json`
- Follow Node.js 18+ compatibility requirements
- Use modern JavaScript features where appropriate
- Maintain backward compatibility with existing configurations

## Deployment and Release

- Adapter requires Node.js >= 18 and js-controller >= 5
- Use semantic versioning for releases
- Update both package.json and io-package.json versions consistently
- Follow ioBroker community adapter guidelines for releases

When suggesting code improvements or new features, always consider:
1. Network reliability and error recovery
2. Configuration validation and user-friendly error messages
3. Proper state management and data types
4. Resource cleanup and memory management
5. Compatibility with different Epson printer models
6. Internationalization support for error messages and descriptions