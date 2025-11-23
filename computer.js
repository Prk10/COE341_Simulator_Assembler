// Basic Computer Simulator Logic

class BasicComputer {
    constructor() {
        // Memory: 4096 words of 16 bits each
        this.memory = new Array(4096).fill(0);

        // Registers
        this.AR = 0;    // Address Register (12 bits)
        this.PC = 0;    // Program Counter (12 bits)
        this.DR = 0;    // Data Register (16 bits)
        this.AC = 0;    // Accumulator (16 bits)
        this.IR = 0;    // Instruction Register (16 bits)
        this.TR = 0;    // Temporary Register (16 bits)
        this.INPR = 0;  // Input Register (8 bits)
        this.OUTR = 0;  // Output Register (8 bits)
        this.SC = 0;    // Sequence Counter (4 bits)

        // Flip-flops
        this.I = 0;     // Indirect addressing mode
        this.S = 1;     // Start-stop flip-flop (1 = running)
        this.E = 0;     // Extended accumulator (carry)
        this.R = 0;     // Interrupt flip-flop
        this.IEN = 0;   // Interrupt enable

        // Execution state
        this.state = 'IDLE';  // Can be IDLE, FETCH, DECODE, INDIRECT, EXECUTE
        this.currentInstruction = 0;
        this.currentMicroOp = '';
        this.changedComponents = [];
        this.componentsInInstruction = [];
        this.componentsToIncrement = [];
        this.componentsToClear = [];
        this.ALUUsed = false;
        this.EUsed = false;
        this.ALUtransfer = false;
        this.instructionName = '';

        // Profiler
        this.totalCycles = 0;
        this.instructionsExecuted = 0;
        this.memoryReads = 0;
        this.memoryWrites = 0;

        // Instruction info
        this.instructionStartCycle = 0;
    }

    // Reset computer to initial state
    reset() {
        this.memory.fill(0);
        this.AR = 0;
        this.PC = 0;
        this.DR = 0;
        this.AC = 0;
        this.IR = 0;
        this.TR = 0;
        this.INPR = 0;
        this.OUTR = 0;
        this.SC = 0;
        this.I = 0;
        this.S = 1;
        this.E = 0;
        this.R = 0;
        this.IEN = 0;
        this.FGI = 0;
        this.FGO = 1;
        this.state = 'IDLE';
        this.currentMicroOp = '';
        this.changedComponents = [];
        this.componentsInInstruction = [];
        this.componentsToIncrement = [];
        this.componentsToClear = [];
        this.ALUUsed = false;
        this.EUsed = false;
        this.ALUtransfer = false;
        this.totalCycles = 0;
        this.instructionsExecuted = 0;
        this.memoryReads = 0;
        this.memoryWrites = 0;
        this.instructionName = '';
    }

    // Load program into memory
    loadProgram(programData) {
        // programData is array of {address, instruction}
        this.PC = programData[0].address & 0xFFF;
        for (let entry of programData) {
            let addr = entry.address & 0xFFF;  // 12-bit address
            let inst = entry.instruction & 0xFFFF;  // 16-bit instruction
            this.memory[addr] = inst;
        }
    }

    // Load data into memory
    loadData(dataArray) {
        // dataArray is array of {address, data}
        for (let entry of dataArray) {
            let addr = entry.address & 0xFFF;
            let data = entry.data & 0xFFFF;
            this.memory[addr] = data;
        }
    }

    // Memory read
    memRead(address) {
        this.memoryReads++;
        return this.memory[address & 0xFFF] & 0xFFFF;
    }

    // Memory write
    memWrite(address, value) {
        this.memoryWrites++;
        this.memory[address & 0xFFF] = value & 0xFFFF;
    }

    // Get opcode from instruction
    getOpcode(instruction) {
        return (instruction >> 12) & 0x7;  // Bits 12-14
    }

    // Get address from instruction
    getAddress(instruction) {
        return instruction & 0xFFF;  // Bits 0-11
    }

    // Get indirect bit from instruction
    getIndirectBit(instruction) {
        return (instruction >> 15) & 0x1;  // Bit 15
    }

    // Decode instruction name
    decodeInstructionName(instruction) {
        const opcode = this.getOpcode(instruction);
        const I = this.getIndirectBit(instruction);

        if (opcode === 7) {
            if (I === 0) {
                // Register-reference
                const ir_bits = instruction & 0xFFF;
                if (ir_bits & 0x800) return 'CLA';
                if (ir_bits & 0x400) return 'CLE';
                if (ir_bits & 0x200) return 'CMA';
                if (ir_bits & 0x100) return 'CME';
                if (ir_bits & 0x080) return 'CIR';
                if (ir_bits & 0x040) return 'CIL';
                if (ir_bits & 0x020) return 'INC';
                if (ir_bits & 0x010) return 'SPA';
                if (ir_bits & 0x008) return 'SNA';
                if (ir_bits & 0x004) return 'SZA';
                if (ir_bits & 0x002) return 'SZE';
                if (ir_bits & 0x001) return 'HLT';
                return 'NOP';
            } else {
                return 'I/O'; // Not Implemented
            }
        } else {
            // Memory-reference
            const names = ['AND', 'ADD', 'LDA', 'STA', 'BUN', 'BSA', 'ISZ'];
            return names[opcode];
        }
    }

    // Execute one clock cycle
    executeCycle() {
        if (this.S === 0) {
            this.currentMicroOp = 'Computer halted';
            return false;  // Computer is halted
        }

        this.changedComponents = [];
        this.totalCycles++;

        // Execute based on timing signal
        switch (this.SC) {
            case 0:  // T0
                return this.executeT0();
            case 1:  // T1
                return this.executeT1();
            case 2:  // T2
                return this.executeT2();
            case 3:  // T3
                return this.executeT3();
            case 4:  // T4
                return this.executeT4();
            case 5:  // T5
                return this.executeT5();
            case 6:  // T6
                return this.executeT6();
            default:
                this.SC = 0;
                return true;
        }
    }

    // T0: Fetch - AR <- PC
    executeT0() {
        this.state = 'FETCH';
        this.AR = this.PC & 0xFFF;
        this
        this.changedComponents = ['AR'];
        this.componentsInInstruction = ['PC', 'AR'];

        this.componentsToClear = [];
        this.componentsToIncrement = [];
        this.ALUUsed = false;
        this.EUsed = false;
        this.ALUtransfer = false;

        this.currentMicroOp = 'T0: AR ← PC';
        this.SC = 1;
        this.instructionStartCycle = this.totalCycles;
        return true;
    }

    // T1: Fetch - IR <- M[AR], PC <- PC + 1
    executeT1() {
        this.state = 'FETCH';
        this.IR = this.memRead(this.AR);
        this.PC = (this.PC + 1) & 0xFFF;
        this.changedComponents = ['IR', 'PC'];
        this.componentsInInstruction = ['M', 'IR'];
        this.componentsToIncrement = ['PC'];

        this.componentsToClear = [];
        this.ALUUsed = false;
        this.EUsed = false;
        this.ALUtransfer = false;

        this.currentMicroOp = 'T1: IR ← M[AR], PC ← PC + 1';
        this.SC = 2;
        this.currentInstruction = this.IR;
        this.instructionName = this.decodeInstructionName(this.IR);
        return true;
    }

    // T2: Decode IR, AR <- IR(0-11), I <- IR(15)
    executeT2() {
        this.state = 'DECODE';
        this.AR = this.getAddress(this.IR);
        this.I = this.getIndirectBit(this.IR);
        this.changedComponents = ['AR', 'I'];
        this.componentsInInstruction = ['IR', 'AR'];

        this.componentsToClear = [];
        this.componentsToIncrement = [];
        this.ALUUsed = false;
        this.EUsed = false;
        this.ALUtransfer = false;

        this.currentMicroOp = 'T2: Decode IR, AR ← IR(0-11), I ← IR(15)';
        this.SC = 3;
        return true;
    }    
    // T3: Determine instruction type and handle indirect
    executeT3() {
        const opcode = this.getOpcode(this.IR);

        if (opcode === 7) {
            // Register-reference or I/O instruction
            if (this.I === 0) {
                // Register-reference
                this.state = 'EXECUTE';
                this.executeRegisterReference();
                this.SC = 0;
                this.instructionsExecuted++;
                return true;
            } else {
                // I/O instruction - not implemented
                this.currentMicroOp = 'T3: I/O instruction (not implemented)';
                this.SC = 0;
                this.instructionsExecuted++;
                return true;
            }
        } else {
            // Memory-reference instruction
            if (this.I === 1) {
                // Indirect addressing
                this.state = 'INDIRECT';
                this.AR = this.memRead(this.AR);
                this.changedComponents = ['AR'];
                this.componentsInInstruction = ['M', 'AR'];

                this.componentsToClear = [];
                this.componentsToIncrement = [];
                this.ALUUsed = false;
                this.EUsed = false;
                this.ALUtransfer = false;

                this.currentMicroOp = 'T3: AR ← M[AR] (Indirect)';
                this.SC = 4;
                return true;
            } else {
                // Direct addressing
                this.state = 'EXECUTE';
                this.currentMicroOp = 'T3: Direct addressing, proceed to execute';
                this.SC = 4;
                return true;
            }
        }
    }

    // T4: Execute memory-reference instructions (part 1)
    executeT4() {
        this.state = 'EXECUTE';
        const opcode = this.getOpcode(this.IR);

        switch (opcode) {
            case 0:  // AND
                this.DR = this.memRead(this.AR);
                this.changedComponents = ['DR'];
                this.componentsInInstruction = ['M', 'DR'];

                this.componentsToClear = [];
                this.componentsToIncrement = [];
                this.ALUUsed = false;
                this.EUsed = false;
                this.ALUtransfer = false;

                this.currentMicroOp = 'T4: DR ← M[AR]';
                this.SC = 5;
                return true;

            case 1:  // ADD
                this.DR = this.memRead(this.AR);
                this.changedComponents = ['DR'];
                this.componentsInInstruction = ['M', 'DR'];

                this.componentsToClear = [];
                this.componentsToIncrement = [];
                this.ALUUsed = false;
                this.EUsed = false;
                this.ALUtransfer = false;

                this.currentMicroOp = 'T4: DR ← M[AR]';
                this.SC = 5;
                return true;

            case 2:  // LDA
                this.DR = this.memRead(this.AR);
                this.changedComponents = ['DR'];
                this.componentsInInstruction = ['M', 'DR'];

                this.componentsToClear = [];
                this.componentsToIncrement = [];
                this.ALUUsed = false;
                this.ALUtransfer = false;
                this.EUsed = false;

                this.currentMicroOp = 'T4: DR ← M[AR]';
                this.SC = 5;
                return true;

            case 3:  // STA
                this.memWrite(this.AR, this.AC);
                this.changedComponents = ['Memory'];
                this.componentsInInstruction = ['AC', 'M'];

                this.componentsToClear = [];
                this.componentsToIncrement = [];
                this.ALUUsed = false;
                this.ALUtransfer = false;
                this.EUsed = false;

                this.currentMicroOp = 'T4: M[AR] ← AC';
                this.SC = 0;
                this.instructionsExecuted++;
                return true;

            case 4:  // BUN
                this.PC = this.AR & 0xFFF;
                this.changedComponents = ['PC'];
                this.componentsInInstruction = ['AR', 'PC'];

                this.componentsToClear = [];
                this.componentsToIncrement = [];
                this.ALUUsed = false;
                this.ALUtransfer = false;
                this.EUsed = false;

                this.currentMicroOp = 'T4: PC ← AR';
                this.SC = 0;
                this.instructionsExecuted++;
                return true;

            case 5:  // BSA
                this.memWrite(this.AR, this.PC);
                this.AR = (this.AR + 1) & 0xFFF;
                this.changedComponents = ['Memory', 'AR'];
                this.componentsInInstruction = ['PC', 'M'];
                this.componentsToIncrement = ['AR'];

                this.componentsToClear = [];
                this.ALUUsed = false;
                this.EUsed = false;
                this.ALUtransfer = false;

                this.currentMicroOp = 'T4: M[AR] ← PC, AR ← AR + 1';
                this.SC = 5;
                return true;

            case 6:  // ISZ
                this.DR = this.memRead(this.AR);
                this.changedComponents = ['DR'];
                this.componentsInInstruction = ['M', 'DR'];

                this.componentsToClear = [];
                this.componentsToIncrement = [];
                this.ALUUsed = false;
                this.EUsed = false;
                this.ALUtransfer = false;

                this.currentMicroOp = 'T4: DR ← M[AR]';
                this.SC = 5;
                return true;

            default:
                this.SC = 0;
                return true;
        }
    }

    // T5: Execute memory-reference instructions (part 2)
    executeT5() {
        this.state = 'EXECUTE';
        const opcode = this.getOpcode(this.IR);

        switch (opcode) {
            case 0:  // AND
                this.AC = (this.AC & this.DR) & 0xFFFF;
                this.changedComponents = ['AC'];
                this.componentsInInstruction = ['DR', 'AC'];
                this.currentMicroOp = 'T5: AC ← AC ∧ DR';
                this.ALUUsed = true;

                this.componentsToClear = [];
                this.componentsToIncrement = [];
                this.EUsed = false;
                this.ALUtransfer = false;

                this.SC = 0;
                this.instructionsExecuted++;
                return true;

            case 1:  // ADD
                const sum = this.AC + this.DR;
                this.E = (sum > 0xFFFF) ? 1 : 0;
                this.AC = sum & 0xFFFF;
                this.changedComponents = ['AC', 'E'];
                this.componentsInInstruction = ['DR', 'AC'];
                this.ALUUsed = true;
                this.EUsed = true;

                this.componentsToClear = [];
                this.componentsToIncrement = [];
                this.ALUtransfer = false;

                this.currentMicroOp = 'T5: AC ← AC + DR, E ← Cout';
                this.SC = 0;
                this.instructionsExecuted++;
                return true;

            case 2:  // LDA
                this.AC = this.DR & 0xFFFF;
                this.changedComponents = ['AC'];
                this.componentsInInstruction = ['DR', 'AC'];
                this.ALUUsed = true;

                this.componentsToClear = [];
                this.componentsToIncrement = [];
                this.ALUtransfer = true;
                this.EUsed = false;

                this.currentMicroOp = 'T5: AC ← DR';
                this.SC = 0;
                this.instructionsExecuted++;
                return true;

            case 5:  // BSA
                this.PC = this.AR & 0xFFF;
                this.changedComponents = ['PC'];
                this.componentsInInstruction = ['AR', 'PC'];

                this.componentsToClear = [];
                this.componentsToIncrement = [];
                this.ALUUsed = false;
                this.EUsed = false;
                this.ALUtransfer = false;

                this.currentMicroOp = 'T5: PC ← AR';
                this.SC = 0;
                this.instructionsExecuted++;
                return true;

            case 6:  // ISZ
                this.DR = (this.DR + 1) & 0xFFFF;
                this.changedComponents = ['DR'];
                this.componentsInInstruction = ['DR'];
                this.componentsToIncrement = ['DR'];

                this.componentsToClear = [];
                this.ALUUsed = false;
                this.EUsed = false;
                this.ALUtransfer = false;

                this.currentMicroOp = 'T5: DR ← DR + 1';
                this.SC = 6;
                return true;

            default:
                this.SC = 0;
                return true;
        }
    }

    // T6: Execute ISZ (part 3)
    executeT6() {
        this.state = 'EXECUTE';
        const opcode = this.getOpcode(this.IR);

        if (opcode === 6) {  // ISZ
            this.memWrite(this.AR, this.DR);
            if (this.DR === 0) {
                this.PC = (this.PC + 1) & 0xFFF;
                this.changedComponents = ['Memory', 'PC'];
                this.componentsInInstruction = ['DR', 'M'];
                this.componentsToIncrement = ['PC'];

                this.componentsToClear = [];
                this.ALUUsed = false;
                this.EUsed = false;
                this.ALUtransfer = false;

                this.currentMicroOp = 'T6: M[AR] ← DR, PC ← PC + 1 (skip)';
            } else {
                this.changedComponents = ['Memory'];
                this.componentsInInstruction = ['DR', 'M'];

                this.componentsToClear = [];
                this.componentsToIncrement = [];
                this.ALUUsed = false;
                this.EUsed = false;
                this.ALUtransfer = false;

                this.currentMicroOp = 'T6: M[AR] ← DR';
            }
            this.SC = 0;
            this.instructionsExecuted++;
            return true;
        }

        this.SC = 0;
        return true;
    }

    // Execute register-reference instructions
    executeRegisterReference() {
        const ir_bits = this.IR & 0xFFF;
        let executed = false;

        // CLA - Clear AC
        if (ir_bits & 0x800) {
            this.AC = 0;
            this.changedComponents.push('AC');
            this.componentsInInstruction = ['AC'];

            this.componentsToClear = ['AC'];
            this.componentsToIncrement = [];
            this.EUsed = false;
            this.ALUtransfer = false;
            this.ALUUsed = false;

            this.currentMicroOp = 'T3: AC ← 0 (CLA)';
            executed = true;
        }

        // CLE - Clear E
        if (ir_bits & 0x400) {
            this.E = 0;
            this.changedComponents.push('E');
            this.EUsed = true;

            this.componentsToClear = [];
            this.componentsToIncrement = [];
            this.ALUUsed = false;
            this.ALUtransfer = false;

            this.currentMicroOp = 'T3: E ← 0 (CLE)';
            executed = true;
        }

        // CMA - Complement AC
        if (ir_bits & 0x200) {
            this.AC = (~this.AC) & 0xFFFF;
            this.changedComponents.push('AC');
            this.componentsInInstruction = ['AC'];
            this.ALUUsed = true;

            this.componentsToClear = [];
            this.componentsToIncrement = [];
            this.EUsed = false;
            this.ALUtransfer = false;

            this.currentMicroOp = `T3: AC ← AC ${(CMA)}`;
            executed = true;
        }

        // CME - Complement E
        if (ir_bits & 0x100) {
            this.E = this.E ? 0 : 1;
            this.changedComponents.push('E');
            this.componentsInInstruction = ['AC'];
            this.EUsed = true;

            this.componentsToClear = [];
            this.componentsToIncrement = [];
            this.ALUUsed = false;
            this.ALUtransfer = false;

            this.currentMicroOp = `T3: E ← E' ${(CME)}`;
            executed = true;
        }

        // CIR - Circulate right
        if (ir_bits & 0x080) {
            const temp_e = this.AC & 0x1;
            this.AC = ((this.E << 15) | (this.AC >> 1)) & 0xFFFF;
            this.E = temp_e;
            this.changedComponents.push('AC', 'E');
            this.componentsInInstruction = ['AC'];
            this.ALUUsed = true;
            this.EUsed = true;

            this.componentsToClear = [];
            this.componentsToIncrement = [];
            this.ALUtransfer = false;

            this.currentMicroOp = 'T3: AC ← shr AC, AC(15) ← E, E ← AC(0) (CIR)';
            executed = true;
        }

        // CIL - Circulate left
        if (ir_bits & 0x040) {
            const temp_e = (this.AC >> 15) & 0x1;
            this.AC = ((this.AC << 1) | this.E) & 0xFFFF;
            this.E = temp_e;
            this.changedComponents.push('AC', 'E');
            this.componentsInInstruction = ['AC'];
            this.ALUUsed = true;
            this.EUsed = true;

            this.componentsToClear = [];
            this.componentsToIncrement = [];
            this.ALUtransfer = false;

            this.currentMicroOp = 'T3: AC ← shl AC, AC(0) ← E, E ← AC(15) (CIL)';
            executed = true;
        }

        // INC - Increment AC
        if (ir_bits & 0x020) {
            this.AC = (this.AC + 1) & 0xFFFF;
            this.changedComponents.push('AC');
            this.componentsToIncrement = ['AC'];

            this.componentsToClear = [];
            this.componentsToIncrement = [];
            this.ALUUsed = false;
            this.EUsed = false;
            this.ALUtransfer = false;

            this.currentMicroOp = 'T3: AC ← AC + 1 (INC)';
            executed = true;
        }

        // SPA - Skip if AC positive
        if (ir_bits & 0x010) {
            if ((this.AC & 0x8000) === 0) {
                this.PC = (this.PC + 1) & 0xFFF;
                this.changedComponents.push('PC');
                this.componentsToIncrement = ['PC'];

                this.componentsToClear = [];
                this.ALUUsed = false;
                this.EUsed = false;
                this.ALUtransfer = false;

                this.currentMicroOp = 'T3: PC ← PC + 1 (SPA, AC positive)';
            } else {
                this.currentMicroOp = 'T3: SPA, AC negative, no skip';
            }
            executed = true;
        }

        // SNA - Skip if AC negative
        if (ir_bits & 0x008) {
            if ((this.AC & 0x8000) !== 0) {
                this.PC = (this.PC + 1) & 0xFFF;
                this.changedComponents.push('PC');
                this.componentsToIncrement = ['PC'];

                this.componentsToClear = [];
                this.ALUUsed = false;
                this.EUsed = false;
                this.ALUtransfer = false;

                this.currentMicroOp = 'T3: PC ← PC + 1 (SNA, AC negative)';
            } else {
                this.currentMicroOp = 'T3: SNA, AC positive, no skip';
            }
            executed = true;
        }

        // SZA - Skip if AC zero
        if (ir_bits & 0x004) {
            if (this.AC === 0) {
                this.PC = (this.PC + 1) & 0xFFF;
                this.changedComponents.push('PC');
                this.componentsToIncrement = ['PC'];

                this.componentsToClear = [];
                this.ALUUsed = false;
                this.EUsed = false;
                this.ALUtransfer = false;

                this.currentMicroOp = 'T3: PC ← PC + 1 (SZA, AC zero)';
            } else {
                this.currentMicroOp = 'T3: SZA, AC not zero, no skip';
            }
            executed = true;
        }

        // SZE - Skip if E zero
        if (ir_bits & 0x002) {
            if (this.E === 0) {
                this.PC = (this.PC + 1) & 0xFFF;
                this.changedComponents.push('PC');
                this.componentsToIncrement = ['PC'];

                this.componentsToClear = [];
                this.ALUUsed = false;
                this.EUsed = false;
                this.ALUtransfer = false;

                this.currentMicroOp = 'T3: PC ← PC + 1 (SZE, E zero)';
            } else {
                this.currentMicroOp = 'T3: SZE, E not zero, no skip';
            }
            executed = true;
        }

        // HLT - Halt computer
        if (ir_bits & 0x001) {
            this.S = 0;
            this.changedComponents.push('S');

            this.componentsToClear = [];
            this.componentsToIncrement = [];
            this.ALUUsed = false;
            this.EUsed = false;
            this.ALUtransfer = false;

            this.currentMicroOp = 'T3: S ← 0 (HLT)';
            executed = true;
        }

        if (!executed) {
            this.currentMicroOp = 'T3: No operation';
        }
    }

    // Execute one complete instruction
    executeInstruction() {
        let cyclesInInstruction = 0;
        const maxCycles = 10;  // Safety limit

        while (cyclesInInstruction < maxCycles) {
            const continueExec = this.executeCycle();
            cyclesInInstruction++;

            if (!continueExec) {
                return false;  // Halted
            }

            if (this.SC === 0) {
                break;  // Instruction complete
            }
        }

        return true;
    }

    // Run until HLT
    run() {
        const maxInstructions = 10000;  // Safety limit
        let count = 0;

        while (this.S === 1 && count < maxInstructions) {
            const continueRun = this.executeInstruction();
            if (!continueRun) {
                break;
            }
            count++;
        }

        if (count >= maxInstructions) {
            this.currentMicroOp = 'Execution stopped: Maximum instruction limit reached';
            return false;
        }

        return true;
    }

    // Get profiler stats
    getProfiler() {
        const cpi = this.instructionsExecuted > 0 
            ? (this.totalCycles / this.instructionsExecuted).toFixed(2) 
            : '0.00';
        const bandwidth = this.memoryReads + this.memoryWrites;

        return {
            totalCycles: this.totalCycles,
            instructionsExecuted: this.instructionsExecuted,
            cpi: cpi,
            memoryReads: this.memoryReads,
            memoryWrites: this.memoryWrites,
            bandwidth: bandwidth
        };
    }

    // Format number as hex
    toHex(value, digits) {
        return '0x' + value.toString(16).toUpperCase().padStart(digits, '0');
    }

    // Format number as binary
    toBin(value, digits) {
        return value.toString(2).padStart(digits, '0');
    }

    // Convert to signed decimal
    toSignedDec(value, bits) {
        const mask = (1 << bits) - 1;
        value = value & mask;
        const sign = value & (1 << (bits - 1));
        if (sign) {
            return value - (1 << bits);
        }
        return value;
    }
}

// Create global computer instance
const computer = new BasicComputer();