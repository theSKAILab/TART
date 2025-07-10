import { LabelManager } from './LabelManager'
import { AnnotationManager } from './AnnotationManager'

// LIKELY DROP THIS SPECIALIZED CLASS
export abstract class Exporter {
  public static exportToJSON(annotations: AnnotationManager, labels: LabelManager): string {
    const outputObject: object = {
      classes: labels.toJSON(),
      annotations: annotations.toJSON(),
    }
    console.log(outputObject)
    return JSON.stringify(outputObject, null, 2)
  }
}
