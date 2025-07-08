import { Entity, LabelClass, History, Paragraph } from "./RichEntityFormat";

export class TMToken {
  public type: string;
  public start: number;
  public end: number;
  public text: string;
  public currentState: string;
  public previousState?: string; // Optional field for previous state in review mode

  constructor(type: string, start: number, end: number, text: string, currentState: string) {
    this.type = type;
    this.start = start;
    this.end = end;
    this.text = text;
    this.currentState = currentState;
  }

  public static fromObject(obj: any[]): TMToken {
    return new TMToken(
      "token",
      obj[0],
      obj[1],
      obj[2],
      "Candidate"
    );
  }
}

export class TMTokenBlock {
  public type: string = "token-block"; // Default type for token blocks
  public start: number;
  public end: number;
  public tokens: TMToken[];
  public labelClass: any; // TODO: MAKE SPECIFIC LATER
  public currentState: string;
  public reviewed: boolean;
  public history: any[]; // TODO: MAKE SPECIFIC LATER
  public previousState?: string; // Optional field for previous state in review mode

  constructor(start: number, end: number, tokens: TMToken[], labelClass: any, currentState: string, reviewed: boolean = false, history: any[] = []) {
    this.start = start;
    this.end = end;
    this.tokens = tokens;
    this.labelClass = labelClass;
    this.currentState = currentState;
    this.reviewed = reviewed;
    this.history = history;
  }
}

export default class TokenManager {
  public classes: LabelClass[];
  public tokens: (TMToken|TMTokenBlock)[]; // Array of TMToken or TMTokenBlock objects

  constructor(classes: LabelClass[], tokens: object[], currentParagraph: Paragraph|null = null) {
      this.classes = classes;
      this.tokens = tokens.map((t: object) => TMToken.fromObject(t));

      if (currentParagraph) {
          // Reset previous annotation state
          for (let i = 0; i < currentParagraph.entities.length; i++) {
              const entity: Entity = currentParagraph.entities[i];
              entity.labelClass = this.classes.find(c => c.name === entity.labelName);
              this.addBlockFromEntity(entity);
          }
      }
  }

  public addNewBlock(start: number, end: number, labelClass: LabelClass|undefined, currentState: string, history: History[] = [], runMode: string = "annotate"): void {
    const selectionStart: number = end < start ? end : start;
    const selectionEnd: number = end > start ? end : start;
    let overlappedBlock: (TMToken|TMTokenBlock)|null = null;

    let selectedTokens: TMToken[] = [];
    const newTokens: (TMToken|TMTokenBlock)[] = [];

    for(let i:number = 0; i < this.tokens.length; i++) {
      const currentToken: TMToken|TMTokenBlock = this.tokens[i];
      if (currentToken.start >= selectionEnd && selectedTokens.length) {
        // We are outside of the selection, add the new block here
        newTokens.push(new TMTokenBlock(
          selectedTokens[0].start,
          selectedTokens[selectedTokens.length - 1].end,
          selectedTokens,
          labelClass,
          currentState,
          false, // reviewed
          history
        ));
        selectedTokens = [];
        newTokens.push(currentToken);
      } else if (currentToken.start >= selectionStart && currentToken.end <= selectionEnd) {
        // Overlapping Selection
        // Token is inside the selection
        if (currentToken.type === "token-block") {
          if (runMode == "review") {
            currentToken.previousState = currentToken.currentState;
            currentToken.currentState = currentState;
            overlappedBlock = {...currentToken};
            // Remove existing block
            this.removeBlock(currentToken.start);
            // Backup
            i--;
          } else {
            this.removeBlock(currentToken.start); // Remove existing block
            i--;
          }
        } else if (currentToken.type === "token") {
          selectedTokens.push(currentToken);
        }
      } else {
        newTokens.push(currentToken);
      }
    }

    if (selectedTokens.length) {
      newTokens.push(new TMTokenBlock(
        selectedTokens[0].start,
        selectedTokens[selectedTokens.length - 1].end,
        selectedTokens,
        labelClass,
        currentState,
        false, // reviewed
        history
      ));
      selectedTokens = []; // Ensure selected tokens are cleared after use
    }

    // If there is an overlapped block and we are in review mode, add it back to the new tokens array
    if (overlappedBlock && runMode === "review") {
      // Add the overlapped block back to the new tokens array
      newTokens.push(overlappedBlock);
    }

    // Update the tokens array with new tokens
    newTokens.sort((a, b) => a.start - b.start);
    this.tokens = newTokens;
  }

  public addBlockFromEntity(entity: Entity): void {
    this.addNewBlock(
      entity.start,
      entity.end,
      entity.labelClass,
      entity.currentState || "Candidate",
      entity.history || [],
      "annotate" // Default run mode
    )
  }

  public removeBlock(start: number, reintroduceTokens: boolean = true): void {
    const newTokens: (TMToken|TMTokenBlock)[] = [];
    for (let i: number = 0; i < this.tokens.length; i++) {
      // If there is a token block that is targeted for removal
      // Remove it and add the tokens back to the array
      // Note: Skip this step for instances like when undoing an overlapping block action
      if (this.tokens[i].type == "token-block" && this.tokens[i].start == start) {
        if (reintroduceTokens) newTokens.push(...this.tokens[i].tokens);
      } else {
        newTokens.push(this.tokens[i]);
      }
      this.tokens = newTokens;
    }
  }

  public removeDuplicateBlocks(): void {
    this.tokens = [...new Set(this.tokens.sort((a, b) => a.start - b.start))]
  }

  public getBlockByStart(start: number): TMTokenBlock|TMToken|null {
    for (let i = 0; i < this.tokens.length; i++) {
      const token: TMTokenBlock|TMToken = this.tokens[i];
      if (token.type === "token-block" && token.start === start) {
        return token;
      }
    }
    return null;
  }

  public isOverlapping(start: number, end: number): (TMToken|TMTokenBlock)[]|null {
    const overlappingBlocks: (TMToken|TMTokenBlock)[] = [];

    for (let i = 0; i < this.tokens.length; i++) {
      const currentToken: TMToken|TMTokenBlock = this.tokens[i];
      if (currentToken.type === "token-block") {
        if (
          (
            (start >= currentToken.start && start <= currentToken.end) || 
            (end >= currentToken.start && end <= currentToken.end)
          )
          ) {
              overlappingBlocks.push(currentToken);
            }
      }
    }

    return overlappingBlocks.length > 0? overlappingBlocks : null;
  }

  //TODO: IMPLEMENT export
}