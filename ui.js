// ui.js - User Interface Logic for Basic Computer Simulator

let originalProgramData = []; 

// UI Update Functions
function updateUI() {
    updateRegisters();
    updateFlags();
    updateExecutionStatus();
    updateProfiler();
}

function updateRegisters() {
    // Update register values
    const iframe = document.querySelector('iframe'); 
    
    // We only check if the iframe exists, we don't need to check for the function anymore
    if (iframe && iframe.contentWindow) {
        const updates = {
            "AR": computer.toHex(computer.AR, 3),
            "PC": computer.toHex(computer.PC, 3),
            "DR": computer.toHex(computer.DR, 4),
            "IR": computer.toHex(computer.IR, 4),
            "TR": computer.toHex(computer.TR, 4),
            "AC": computer.toHex(computer.AC, 4),
            "INPR": computer.toHex(computer.INPR, 2), 
            "OUTR": computer.toHex(computer.OUTR, 2), 
            "M": computer.toHex(computer.memory[computer.AR], 4)
        };
        
        // Send a safe message to the iframe
        // '*' allows any origin (safe for local testing), or use 'http://127.0.0.1:5500' if using Live Server
        iframe.contentWindow.postMessage({ 
            type: 'UPDATE_REGISTERS', 
            data: updates 
        }, '*');
    }

    // Update detailed register view
    document.getElementById('ac-detail-hex').textContent = computer.toHex(computer.AC, 4);
    document.getElementById('ac-detail-bin').textContent = computer.toBin(computer.AC, 16);
    document.getElementById('ac-detail-dec').textContent = '(' + computer.toSignedDec(computer.AC, 16) + ')';

    document.getElementById('dr-detail-hex').textContent = computer.toHex(computer.DR, 4);
    document.getElementById('dr-detail-bin').textContent = computer.toBin(computer.DR, 16);
    document.getElementById('dr-detail-dec').textContent = '(' + computer.toSignedDec(computer.DR, 16) + ')';

    document.getElementById('ar-detail-hex').textContent = computer.toHex(computer.AR, 3);
    document.getElementById('ar-detail-bin').textContent = computer.toBin(computer.AR, 12);

    document.getElementById('pc-detail-hex').textContent = computer.toHex(computer.PC, 3);
    document.getElementById('pc-detail-bin').textContent = computer.toBin(computer.PC, 12);

    document.getElementById('ir-detail-hex').textContent = computer.toHex(computer.IR, 4);
    document.getElementById('ir-detail-bin').textContent = computer.toBin(computer.IR, 16);

    document.getElementById('tr-detail-hex').textContent = computer.toHex(computer.TR, 4);
    document.getElementById('tr-detail-bin').textContent = computer.toBin(computer.TR, 16);
}

function updateFlags() {
    document.getElementById('flag-i').textContent = computer.I;
    document.getElementById('flag-e').textContent = computer.E;
    document.getElementById('flag-s').textContent = computer.S;
    document.getElementById('flag-r').textContent = computer.R;
    document.getElementById('flag-ien').textContent = computer.IEN;
}

function updateExecutionStatus() {
    const stateMap = {
        'IDLE': 'Idle',
        'FETCH': 'Fetching',
        'DECODE': 'Decoding',
        'INDIRECT': 'Reading Indirect Address',
        'EXECUTE': 'Executing'
    };

    document.getElementById('exec-state').textContent = stateMap[computer.state] || computer.state;
    document.getElementById('exec-instruction').textContent = 
        computer.toHex(computer.currentInstruction, 4) + ' (' + computer.instructionName + ')';
    document.getElementById('exec-microop').textContent = computer.currentMicroOp;
    document.getElementById('exec-changed').textContent = 
        computer.changedComponents.length > 0 ? computer.changedComponents.join(', ') : 'None';
}

function updateProfiler() {
    const stats = computer.getProfiler();
    document.getElementById('prof-cycles').textContent = stats.totalCycles;
    document.getElementById('prof-instructions').textContent = stats.instructionsExecuted;
    document.getElementById('prof-cpi').textContent = stats.cpi;
    document.getElementById('prof-reads').textContent = stats.memoryReads;
    document.getElementById('prof-writes').textContent = stats.memoryWrites;
    document.getElementById('prof-bandwidth').textContent = stats.bandwidth;
}

function highlightTransfer(sourceName, destName, RegisterToIncrement, RegisterToCLR, ALU, E, ALUTransfer) {
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ 
            type: 'HIGHLIGHT_TRANSFER', 
            source: sourceName,
            dest: destName,
            increment: RegisterToIncrement,
            clr: RegisterToCLR,
            ALUUsed: ALU,
            EUsed: E,
            ALUTransfer: ALUTransfer
        }, '*');
    }
}

// Function to reset all animations and highlights
function resetAnimations() {
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
         iframe.contentWindow.postMessage({ type: 'RESET_ANIMATIONS' }, '*');
    }
}

// Function to update the command output console
function appendToOutput(message) {
    const outputElement = document.getElementById('command-output');
    if (outputElement) {
        outputElement.textContent += `\n> ${message}`;
        outputElement.scrollTop = outputElement.scrollHeight; // Auto-scroll
    }
}

// Function to display the loaded program content in the new HTML textarea
function displayLoadedProgram(programText) {
    const displayArea = document.getElementById('loaded-program-display');
    if (!displayArea) return;

    // Clear previous content
    displayArea.innerHTML = ''; 

    // Split content into individual lines
    const lines = programText.trim().split('\n');

    lines.forEach((line, index) => {
        const lineElement = document.createElement('div');
        // Add a class for styling and a data attribute for easy identification
        lineElement.classList.add('program-line');
        lineElement.dataset.address = line.trim().split(' ')[0]; // Assuming address is the first word
        lineElement.textContent = line;
        displayArea.appendChild(lineElement);
    });
}

// File Loading Functions
function loadProgramFile() {
    const fileInput = document.getElementById('program-file');
    const file = fileInput.files[0];

    if (!file) {
        appendToOutput('Error: No file selected');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        parseProgramContent(content);

        // 2. *** Display the content in the new 'Loaded Program' textarea ***
        displayLoadedProgram(content); 

        // 3. Update the console/status
        appendToOutput(`Program loaded from file: ${file.name}`);
    };
    reader.readAsText(file);
}

function loadDataFile() {
    const fileInput = document.getElementById('data-file');
    const file = fileInput.files[0];

    if (!file) {
        appendToOutput('Error: No file selected');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        parseDataContent(content);

        // 2. Update the console/status
        appendToOutput(`Data loaded from file: ${file.name}`);
    };
    reader.readAsText(file);
}

//Load Assembly file
function loadAssemblyFile() {
    const fileInput = document.getElementById('asm-file-upload');
    const file = fileInput.files[0];

    if (!file) {
        appendToOutput('Error: No assembly file selected');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        // Set the content into the textarea
        document.getElementById('assembly-input').value = content;
        appendToOutput(`Assembly source loaded from: ${file.name}`);
    };
    reader.readAsText(file);
}

function highlightCurrentInstruction(currentPC) {
    const displayArea = document.getElementById('loaded-program-display');
    if (!displayArea) return;

    // 1. Remove highlight from ALL previously active lines
    const activeLine = displayArea.querySelector('.program-line-active');
    if (activeLine) {
        activeLine.classList.remove('program-line-active');
    }

    // 2. Format the PC value to match the address format in the display
    // Assuming a 12-bit address, padded to 3 hex digits: 0x000 to 0xFFF
    const pcHex = currentPC.toString(16).toUpperCase().padStart(3, '0');

    // 3. Find the new line to highlight using the data-address attribute
    const newLineToHighlight = displayArea.querySelector(`[data-address="${pcHex}"]`);

    // 4. Apply the highlight class
    if (newLineToHighlight) {
        newLineToHighlight.classList.add('program-line-active');

        // Optional: Scroll the container to ensure the line is visible
        newLineToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function loadProgramManual() {
    const content = document.getElementById('program-input').value;
    if (!content.trim()) {
        appendToOutput('Error: No program entered');
        return;
    }
    parseProgramContent(content);
    // 2. *** Display the content in the new 'Loaded Program' textarea ***
    displayLoadedProgram(content); 
}

function parseProgramContent(content) {
    try {
        const lines = content.split('\n');
        const programData = [];
        
        // 1. Clear previous saved program
        originalProgramData = [];

        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('//') || line.startsWith('#')) continue;

            const parts = line.split(/\s+/);
            if (parts.length >= 2) {
                const address = parseInt(parts[0], 16);
                const instruction = parseInt(parts[1], 16);

                if (!isNaN(address) && !isNaN(instruction)) {
                    programData.push({ address, instruction });
                    
                    // 2. Save instruction for Reset
                    originalProgramData.push({ address: address, value: instruction });
                }
            }
        }

        if (programData.length === 0) {
            appendToOutput('Error: No valid program data found');
            return;
        }

        computer.loadProgram(programData);
        appendToOutput(`Program loaded successfully: ${programData.length} instructions`);
        updateUI();
        viewMemory();
        
        // 3. Highlight the first line immediately
        if(programData.length > 0) {
             highlightCurrentInstruction(programData[0].address);
        }

    } catch (error) {
        appendToOutput('Error parsing program: ' + error.message);
    }
}

function parseDataContent(content) {
    try {
        const lines = content.split('\n');
        const dataArray = [];

        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('//') || line.startsWith('#')) continue;

            const parts = line.split(/\s+/);
            if (parts.length >= 2) {
                const address = parseInt(parts[0], 16);
                const data = parseInt(parts[1], 16);

                if (!isNaN(address) && !isNaN(data)) {
                    dataArray.push({ address, data });

                    // 1. Save data value for Reset
                    originalProgramData.push({ address: address, value: data });
                }
            }
        }

        if (dataArray.length === 0) {
            appendToOutput('Error: No valid data found');
            return;
        }

        computer.loadData(dataArray);
        appendToOutput(`Data loaded successfully: ${dataArray.length} words`);
        updateUI();
        viewMemory();
    } catch (error) {
        appendToOutput('Error parsing data: ' + error.message);
    }
}

// Execution Control Functions
function executeNextCycle() {
    const result = computer.executeCycle();
    const componentsToHighlight = computer.componentsInInstruction;
    const componentsToIncrement = computer.componentsToIncrement;
    const componentsToClear = computer.componentsToClear;
    const ALUUsed = computer.ALUUsed;
    const EUsed = computer.EUsed;
    const ALUTransfer = computer.ALUtransfer;
    updateUI();
    highlightTransfer(componentsToHighlight[0], componentsToHighlight[1], componentsToIncrement[0], componentsToClear[0], ALUUsed, EUsed, ALUTransfer);

    // Get the PC value (address of the NEXT instruction)
    const currentPC = computer.PC; 
    
    // Highlight the current instruction running
    highlightCurrentInstruction(currentPC - 1); 

    if (!result) {
        appendToOutput('Computer halted');
    }
}

function executeFastCycle() {
    const n = parseInt(document.getElementById('fast-cycle-n').value) || 5;

    for (let i = 0; i < n; i++) {
        const result = computer.executeCycle();
        if (!result) {
            appendToOutput(`Computer halted after ${i + 1} cycles`);
            break;
        }
    }

    const componentsToHighlight = computer.componentsInInstruction;
    const componentsToIncrement = computer.componentsToIncrement;
    const componentsToClear = computer.componentsToClear;
    const ALUUsed = computer.ALUUsed;
    const EUsed = computer.EUsed;
    const ALUTransfer = computer.ALUtransfer;

    updateUI();
    highlightTransfer(componentsToHighlight[0], componentsToHighlight[1], componentsToIncrement[0], componentsToClear[0], ALUUsed, EUsed, ALUTransfer);

    // Get the PC value (address of the NEXT instruction)
    const currentPC = computer.PC; 
    
    // Highlight the current instruction running
    highlightCurrentInstruction(currentPC - 1); 

    appendToOutput(`Executed ${n} cycles`);
}

function executeNextInstruction() {
    const result = computer.executeInstruction();
    const componentsToHighlight = computer.componentsInInstruction;
    const componentsToIncrement = computer.componentsToIncrement;
    const componentsToClear = computer.componentsToClear;
    const ALUUsed = computer.ALUUsed;
    const EUsed = computer.EUsed;
    const ALUTransfer = computer.ALUtransfer;
    updateUI();
    highlightTransfer(componentsToHighlight[0], componentsToHighlight[1], componentsToIncrement[0], componentsToClear[0], ALUUsed, EUsed, ALUTransfer);

    // Get the PC value (address of the NEXT instruction)
    const currentPC = computer.PC; 
    
    // Highlight the current instruction running
    highlightCurrentInstruction(currentPC - 1); 

    if (!result) {
        appendToOutput('Computer halted');
    }
}

function executeFastInstruction() {
    const n = parseInt(document.getElementById('fast-inst-n').value) || 5;

    for (let i = 0; i < n; i++) {
        const result = computer.executeInstruction();
        if (!result) {
            appendToOutput(`Computer halted after ${i + 1} instructions`);
            break;
        }
    }

    const componentsToHighlight = computer.componentsInInstruction;
    const componentsToIncrement = computer.componentsToIncrement;
    const componentsToClear = computer.componentsToClear;
    const ALUUsed = computer.ALUUsed;
    const EUsed = computer.EUsed;
    const currentPC = computer.PC;
    const ALUTransfer = computer.ALUtransfer; 

    updateUI();
    highlightTransfer(componentsToHighlight[0], componentsToHighlight[1], componentsToIncrement[0], componentsToClear[0], ALUUsed, EUsed, ALUTransfer);
    highlightCurrentInstruction(currentPC - 1); 
    appendToOutput(`Executed ${n} instructions`);
}

function executeRun() {
    const startTime = Date.now();
    const result = computer.run();
    const endTime = Date.now();
    const componentsToHighlight = computer.componentsInInstruction;
    const componentsToIncrement = computer.componentsToIncrement;
    const componentsToClear = computer.componentsToClear;
    const ALUUsed = computer.ALUUsed;
    const EUsed = computer.EUsed;
    const currentPC = computer.PC;
    const ALUTransfer = computer.ALUtransfer; 

    updateUI();
    highlightTransfer(componentsToHighlight[0], componentsToHighlight[1], componentsToIncrement[0], componentsToClear[0], ALUUsed, EUsed, ALUTransfer);
    highlightCurrentInstruction(currentPC - 1); 

    if (result) {
        appendToOutput(`Program executed successfully in ${endTime - startTime}ms`);
    } else {
        appendToOutput('Execution stopped (limit reached or error)');
    }
    appendToOutput(`Total instructions: ${computer.instructionsExecuted}, Total cycles: ${computer.totalCycles}`);
}

function executeReset() {
    // 1. Reset Hardware Registers
    computer.reset();

    // 2. Restore Memory from the saved backup
    if (originalProgramData && originalProgramData.length > 0) {
        originalProgramData.forEach(item => {
            computer.memory[item.address] = item.value;
        });
        appendToOutput('System Reset: Program & Data reloaded.');
    } else {
        appendToOutput('System Reset: Registers cleared.');
    }

    // 3. Clear the "Stale" UI Status
    if (computer) {
        computer.currentInstruction = 0; 
        computer.instructionName = "Ready"; 
        computer.currentMicroOp = "T0: AR <- PC";
        computer.state = 'FETCH'; 
    }

    // 4. Update the UI
    updateUI();
    resetAnimations(); // Resets the Datapath animation
    
    // 5. Force Highlight to First Instruction (Address 0)
    highlightCurrentInstruction(0);

    // 6. Scroll the program list to the top
    const displayArea = document.getElementById('loaded-program-display');
    if (displayArea) {
        displayArea.scrollTop = 0;
    }

    // 7. Refresh Memory View
    document.getElementById('memory-tbody').innerHTML = '';
    viewMemory();
}

// Command Execution
function executeCommand() {
    const input = document.getElementById('command-input').value.trim();
    if (!input) return;

    appendToOutput('> ' + input);

    const parts = input.toLowerCase().split(/\s+/);
    const command = parts[0];

    try {
        if (command === 'show') {
            if (parts.length < 2) {
                appendToOutput('Error: show command requires an argument');
                return;
            }

            const target = parts[1];

            if (target === 'all') {
                showAll();
            } else if (target === 'profiler') {
                showProfiler();
            } else if (target === 'mem') {
                if (parts.length < 3) {
                    appendToOutput('Error: show mem requires address');
                    return;
                }
                const address = parseInt(parts[2], 16);
                const count = parts.length >= 4 ? parseInt(parts[3]) : 1;
                showMemory(address, count);
            } else {
                showRegister(target);
            }
        } else {
            appendToOutput('Unknown command: ' + command);
            appendToOutput('Available commands: show <register|all|profiler|mem address [count]>');
        }
    } catch (error) {
        appendToOutput('Error: ' + error.message);
    }

    document.getElementById('command-input').value = '';
}

function showRegister(regName) {
    regName = regName.toUpperCase();
    let value, bits;

    switch (regName) {
        case 'AC':
            value = computer.AC;
            bits = 16;
            break;
        case 'DR':
            value = computer.DR;
            bits = 16;
            break;
        case 'AR':
            value = computer.AR;
            bits = 12;
            break;
        case 'PC':
            value = computer.PC;
            bits = 12;
            break;
        case 'IR':
            value = computer.IR;
            bits = 16;
            break;
        case 'TR':
            value = computer.TR;
            bits = 16;
            break;
        case 'SC':
            value = computer.SC;
            bits = 4;
            appendToOutput(`SC = ${value}`);
            return;
        case 'E':
            appendToOutput(`E = ${computer.E}`);
            return;
        case 'I':
            appendToOutput(`I = ${computer.I}`);
            return;
        default:
            appendToOutput(`Unknown register: ${regName}`);
            return;
    }

    const hexDigits = Math.ceil(bits / 4);
    const hex = computer.toHex(value, hexDigits);
    const bin = computer.toBin(value, bits);

    if (bits === 16) {
        const dec = computer.toSignedDec(value, bits);
        appendToOutput(`${regName} = ${hex} (binary: ${bin}) (decimal: ${dec})`);
    } else {
        appendToOutput(`${regName} = ${hex} (binary: ${bin})`);
    }
}

function showAll() {
    const regs = ['AC', 'DR', 'AR', 'PC', 'IR', 'TR'];
    let output = '';

    regs.forEach(reg => {
        let value, hexDigits;
        switch (reg) {
            case 'AC':
            case 'DR':
            case 'IR':
            case 'TR':
                value = computer[reg];
                hexDigits = 4;
                break;
            case 'AR':
            case 'PC':
                value = computer[reg];
                hexDigits = 3;
                break;
        }
        output += `${reg}=${computer.toHex(value, hexDigits)}  `;
    });

    output += `E=${computer.E}  I=${computer.I}  SC=${computer.SC}  S=${computer.S}`;
    appendToOutput(output);
}

function showProfiler() {
    const stats = computer.getProfiler();
    appendToOutput('=== Profiler Statistics ===');
    appendToOutput(`Total cycles executed: ${stats.totalCycles}`);
    appendToOutput(`Instructions executed: ${stats.instructionsExecuted}`);
    appendToOutput(`Average CPI: ${stats.cpi}`);
    appendToOutput(`Memory reads: ${stats.memoryReads}`);
    appendToOutput(`Memory writes: ${stats.memoryWrites}`);
    appendToOutput(`Total memory bandwidth: ${stats.bandwidth}`);
}

function showMemory(address, count) {
    if (isNaN(address) || address < 0 || address >= 4096) {
        appendToOutput('Error: Invalid address');
        return;
    }

    count = Math.min(count, 16);  // Limit to 16 lines

    for (let i = 0; i < count && (address + i) < 4096; i++) {
        const addr = address + i;
        const value = computer.memory[addr];
        const hex = computer.toHex(value, 4);
        const bin = computer.toBin(value, 16);
        appendToOutput(`M[${computer.toHex(addr, 3)}] = ${hex} (binary: ${bin})`);
    }
}

// Memory Viewer
function viewMemory() {
    const startInput = document.getElementById('mem-start').value.trim();
    const count = parseInt(document.getElementById('mem-count').value) || 16;

    let start = 0;
    if (startInput.startsWith('0x') || startInput.startsWith('0X')) {
        start = parseInt(startInput.substring(2), 16);
    } else {
        start = parseInt(startInput, 16);
    }

    if (isNaN(start) || start < 0 || start >= 4096) {
        appendToOutput('Error: Invalid start address');
        return;
    }

    const tbody = document.getElementById('memory-tbody');
    tbody.innerHTML = '';

    for (let i = 0; i < count && (start + i) < 4096; i++) {
        const addr = start + i;
        const value = computer.memory[addr];

        const row = tbody.insertRow();
        row.insertCell(0).textContent = computer.toHex(addr, 3);
        row.insertCell(1).textContent = computer.toHex(value, 4);
        row.insertCell(2).textContent = computer.toBin(value, 16);
        row.insertCell(3).textContent = computer.toSignedDec(value, 16);
    }
}

// Output Functions
function appendToOutput(text) {
    const output = document.getElementById('command-output');
    const currentText = output.textContent;

    if (currentText === 'Ready for commands...') {
        output.textContent = text;
    } else {
        output.textContent = currentText + '\n' + text;
    }

    // Auto-scroll to bottom
    output.scrollTop = output.scrollHeight;
}

function clearOutput() {
    document.getElementById('command-output').textContent = 'Ready for commands...';
}

// Event Listeners
document.getElementById('command-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        executeCommand();
    }
});

// Initialize UI on load
window.addEventListener('load', function() {
    updateUI();
    appendToOutput('=== Mano\'s Basic Computer Simulator ===');
    appendToOutput('Load a program using the file input or manual entry');
    appendToOutput('Use execution controls to run the program');
    appendToOutput('Type "show all" to see all registers');
    appendToOutput('Type "show profiler" to see execution statistics');
    appendToOutput('');
});

// Assembler UI Functions

function assembleCode() {
    const sourceCode = document.getElementById('assembly-input').value;

    if (!sourceCode.trim()) {
        appendToOutput('Error: No assembly code entered');
        return;
    }

    appendToOutput('=== Assembling Code ===');
    const result = assembler.assemble(sourceCode);

    if (result.success) {
        appendToOutput(`✓ Assembly successful: ${result.programData.length} instructions`);

        // Display symbol table
        const symbolTableOutput = assembler.getSymbolTableListing();
        document.getElementById('assembler-output').textContent = symbolTableOutput;

        // Convert to hex format and display
        const hexOutput = assembler.programDataToHex(result.programData);
        appendToOutput('Generated machine code:');
        appendToOutput(hexOutput);

        // Load into computer memory
        computer.loadProgram(result.programData);
        appendToOutput('Program loaded into memory');

        updateUI();
        viewMemory();

        // Display the assembled program in the loaded program section
        displayLoadedProgram(hexOutput);
        switchView('simulator');
    } else {
        appendToOutput('✗ Assembly failed with errors:');
        result.errors.forEach(error => appendToOutput('  ' + error));
        document.getElementById('assembler-output').textContent = 'Assembly Errors:\n' + result.errors.join('\n');
    }
}

function assembleOnly() {
    const sourceCode = document.getElementById('assembly-input').value;

    if (!sourceCode.trim()) {
        appendToOutput('Error: No assembly code entered');
        return;
    }

    appendToOutput('=== Assembling Code (No Load) ===');
    const result = assembler.assemble(sourceCode);

    if (result.success) {
        appendToOutput(`✓ Assembly successful: ${result.programData.length} instructions`);

        // Display symbol table and machine code
        const symbolTableOutput = assembler.getSymbolTableListing();
        const hexOutput = assembler.programDataToHex(result.programData);

        document.getElementById('assembler-output').textContent = 
            symbolTableOutput + '\n\nMachine Code:\n=============\n' + hexOutput;

        appendToOutput('Machine code generated (not loaded into memory)');
        appendToOutput(hexOutput);
    } else {
        appendToOutput('✗ Assembly failed with errors:');
        result.errors.forEach(error => appendToOutput('  ' + error));
        document.getElementById('assembler-output').textContent = 'Assembly Errors:\n' + result.errors.join('\n');
    }
}

function clearAssembler() {
    document.getElementById('assembly-input').value = '';
    document.getElementById('assembler-output').textContent = '';
    appendToOutput('Assembler cleared');
}

//Toggle
function switchView(viewName) {
    const simView = document.getElementById('simulator-view');
    const asmView = document.getElementById('assembler-view');
    const btnSim = document.getElementById('btn-view-sim');
    const btnAsm = document.getElementById('btn-view-asm');

    if (viewName === 'simulator') {
        // Show Simulator, Hide Assembler
        if(simView) simView.classList.remove('hidden');
        if(asmView) asmView.classList.add('hidden');
        
        // Update Buttons
        if(btnSim) btnSim.classList.add('active');
        if(btnAsm) btnAsm.classList.remove('active');
    } else {
        // Show Assembler, Hide Simulator
        if(simView) simView.classList.add('hidden');
        if(asmView) asmView.classList.remove('hidden');
        
        // Update Buttons
        if(btnSim) btnSim.classList.remove('active');
        if(btnAsm) btnAsm.classList.add('active');
    }
}

// ui.js - Add this to the end

function launchSimulator() {
    const overlay = document.getElementById('intro-overlay');
    
    // Add the fade-out class to trigger CSS transition
    overlay.classList.add('fade-out');
    
    // Optional: Play a sound or initialize something here if needed
    console.log("Simulator Launched");
}