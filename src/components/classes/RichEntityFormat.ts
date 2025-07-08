// This is the Rich Entity Format (REF) used in the TeAM-NER project.
// The format is designed to store annotations with the metadata necessary for text entity recognition tasks.

// Export format:
// {
//   "classes": [
//     {
//       "id": CLASS_ID,
//       "name": "CLASS_NAME",
//       "color": "CLASS_COLOR"
//     }
//   ],
//   "annotations": [
//     [
//       "PARAGRAPH_ID",
//       "PARAGRAPH_TEXT",
//       {
//         "entities": [
//           [
//             "ENTITY_ID",
//             "ENTITY_START",
//             "ENTITY_END",
//             [
//               [
//                 "HISTORY_ENTITY_LABEL"
//                 "HISTORY_STATE",
//                 "HISTORY_ANNOTATOR_NAME",
//                 "HISTORY_TIMESTAMP",
//               ]
//             ]
//           ]
//         ]
//       }
//     ],
//   ]
// }
export const REF_VERSION: string = "V.0.1.0";

/**
 * Represents the Rich Entity Format File
 * @param {Paragraph[]} annotations - Array of paragraphs with annotations.
 * @param {LabelClass[]} classes - Array of label classes.
 */
export class REF_File {
    public annotations: Paragraph[]; // Array of paragraphs with annotations
    public classes: LabelClass[]|null = null; // Array of label classes

    public inputSentences = () => {
        return this.annotations.map((paragraph, i) => ({id: i, text: paragraph.text}))
    }

    constructor(annotations: Paragraph[] = [], classes: LabelClass[] = []) {
        this.annotations = annotations.map(paragraph => Paragraph.fromJSON(paragraph)); // Convert each paragraph to a Paragraph instance
        this.classes = classes.map(labelClass => LabelClass.fromJSON(labelClass)); // Convert each label class to a LabelClass instance
    }

    public toJSON(): object {
        return {
            "classes": this.classes.map(labelClass => labelClass.toJSON()), // Convert each label class to JSON
            "annotations": this.annotations.map(paragraph => paragraph.toJSON()) // Convert each paragraph to JSON
        };
    }
}

/**
 * Represents a paragraph in the REF format.
 * @param {string} paragraphText - The text of the paragraph.
 * @optional @param {object} paragraphEntities - The entities associated with the paragraph.
 */
export class Paragraph {
    public text: string;
    public entities: Entity[];
    
    // Export JSON format for the Paragraph class
    private JSONFormat: object = () => {
        return [
            this.text, // The text of the paragraph
            {
                entities: this.entities.map(entity => entity.toJSON()) // Convert each entity to JSON
            }
        ]
    }
    
    // Constructor for the Paragraph class
    constructor(paragraphText: string, paragraphEntities: object[] = []) {
        this.text = paragraphText;
        this.entities = paragraphEntities.length? paragraphEntities.map(entityJSON => Entity.fromJSON(entityJSON)): []; // Array of entities in the paragraph
    }

    /**
     * Converts the Paragraph instance to a JSON object.
     * @returns {object} The JSON representation of the Paragraph.
     */
    public toJSON(): object {
        return this.JSONFormat;
    }

    /**
     * Creates a Paragraph instance from a JSON object.
     * @param {object} json - The JSON object to convert.
     * @returns {Paragraph} The Paragraph instance created from the JSON object.
     */
    public static fromJSON(json: any): Paragraph {
        return new Paragraph(
            json[1],
            json[2].entities
        );
    }
}

/**
 * Represents an entity in the Rich Entity Format.
 * @param {number} start - The start index of the entity in the paragraph.
 * @param {number} end - The end index of the entity in the paragraph.
 * @optional @param {Array} history - The history of the entity, containing label changes and timestamps.
 */
export class Entity {
    public start: number; // Start index of the entity
    public end: number; // End index of the entity
    public currentState: string | undefined; // Current state of the entity, e.g., "active", "inactive"
    public name: string | undefined; // Name of last annotator
    public labelName: string | undefined; // Name of the label assigned to the entity
    public labelClass: LabelClass | undefined; // Label class of the entity
    public history: History[]; // Array to hold the history of label changes
    
    public latestEntry = () => {
        return this.history.length > 0 ? this.history[this.history.length - 1] : null; // Get the latest history entry
    }

    // Export JSON format for the Entity class
    private JSONFormat: object = () => {
        return [
            null, // Placeholder for the entity ID, can be set later
            this.start, // Start index of the entity
            this.end, // End index of the entity
            [this.history.map(historyEntry => historyEntry.toJSON())]
        ]
    }

    // Constructor for the Entity class
    constructor(start: number, end: number, history: object[] = []) {
        this.start = start; // Start index of the entity
        this.end = end; // End index of the entity
        this.history = history.map(historyEntry => History.fromJSON(historyEntry)); // Array to hold the history of label changes, casted
        this.setFromLastHistoryEntry(); // Set the current state, name, and label class from the last history entry
    }

    /**
     * Converts the Entity instance to a JSON object.
     * @returns {JSON} The JSON representation of the Entity.
     */
    toJSON(): object {
        return this.JSONFormat;
    }

    /**
     * Creates an Entity instance from a JSON object.
     * @param {object} json - The JSON object to convert.
     * @returns {Entity} The Entity instance created from the JSON object.
     */
    public static fromJSON(json: object[]): Entity {
        return new Entity(
            json[1],
            json[2],
            json[3]
        );
    }

    /**
     * Sets the current state, name, and label class of the entity from the last history entry.
     */
    private setFromLastHistoryEntry(): void {
        if (this.history.length > 0) {
            this.currentState = this.latestEntry()?.state; // Set the current state from the last history entry
            this.name = this.latestEntry()?.annotatorName; // Set the name of the last annotator from the last history entry
            this.labelName = this.latestEntry()?.label; // Set the label class from the last history entry
        } else {
            this.currentState = "Candidate"; // Default state if no history is present
            this.name = ""; // Default name if no history is present
            this.labelClass = undefined; // Default label class if no history is present
        }
    }
}

/**
 * Represents a history entry for an entity in the Rich Entity Format.
 * @param {string} label - The label of the entity at this point in history.
 * @param {string} state - The state of the entity at this point in history.
 * @param {string} annotatorName - The name of the annotator who made this
 */
export class History {
    public label: string; // The label of the entity at this point in history
    public state: string; // The state of the entity at this point in history
    public annotatorName: string; // The name of the annotator who made this change
    public timestamp: Date | null; // The timestamp when this change was made

    // Export JSON format for the History class
    private ArrayFormat: object = () => {
        return [
            this.label, // The label of the entity at this point in history
            this.state, // The state of the entity at this point in history
            this.timestamp, // The timestamp when this change was made
            this.annotatorName, // The name of the annotator who made this change
        ]
    }

    constructor(label: string, state: string, annotatorName: string, timestamp: Date|null = null) {
        this.label = label;
        this.state = state;
        this.annotatorName = annotatorName;
        this.timestamp = timestamp;
    }

    /**
     * Converts the History instance to a JSON object.
     * @returns {Array} The JSON representation of the History.
     */
    public toJSON(): object {
        return this.ArrayFormat;
    }

    /**
     * Creates a History instance from a JSON object.
     * @param {object} json - The JSON object to convert.
     * @returns {History} The History instance created from the JSON object.
     */
    public static fromJSON(json: any): History {
        return new History(
            json[0],
            json[1],
            json[3],
            json[2]
        );
    }
}

/**
 * Represents a label class in the Rich Entity Format.
 * @param {string} id - The unique identifier for the label class.
 * @param {string} name - The name of the label class.
 * @param {string} color - The color associated with the label class.
*/
export class LabelClass {
    public id: string; // Unique identifier for the label class
    public name: string; // Name of the label class
    public color: string; // Color associated with the label class

    // Export JSON format for the Label class
    private JSONFormat: object = () => {
        return {
            "id": this.id,
            "name": this.name,
            "color": this.color
        }
    }

    constructor(id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;
    }

    /**
     * Converts the LabelClass instance to a JSON object.
     * @returns {JSON} The JSON representation of the LabelClass.
     */
    public toJSON(): object {
        return this.JSONFormat;
    }

    public static fromJSON(json: any): LabelClass {
        return new LabelClass(
            json.id,
            json.name,
            json.color
        );
    }
}