import * as tasks from 'vsts-task-lib/task';
import * as fs from "fs";
import * as utils from "../Utils";
import { configureTool, argument, argumentIfSet, flag, multiArgument } from '../Utils';

export interface PackageRequiredInputs {
    packageId : string;
    packageFormat : string;
}
export interface PackageOptionalInputs{
    packageVersion? : string;
    outputPath? : string;
    sourcePath?  : string;
    nuGetAuthor? : string;
    nuGetTitle? : string;
    nuGetDescription?  : string;
    nuGetReleaseNotes? : string;
    nuGetReleaseNotesFile? : string;
    include? : string[];
    listFiles : boolean;
    overwrite : boolean;
}

export type PackageInputs = PackageRequiredInputs & PackageOptionalInputs;

export const configure = (inputs: PackageInputs) => {
    return configureTool([
        argument("id", inputs.packageId),
        argument("format", inputs.packageFormat),
        argumentIfSet("version", inputs.packageVersion),
        argumentIfSet("outFolder", inputs.outputPath),
        argumentIfSet("basePath", inputs.sourcePath),
        argumentIfSet("author", inputs.nuGetAuthor),
        argumentIfSet("title", inputs.nuGetTitle),
        argumentIfSet("description",inputs.nuGetDescription),
        argumentIfSet("releaseNotes", inputs.nuGetReleaseNotes),
        argument("overwrite", inputs.overwrite.toString()),
        (tool) => {
            if(!utils.isNullOrWhitespace(inputs.nuGetReleaseNotesFile) && fs.existsSync(inputs.nuGetReleaseNotesFile) && fs.lstatSync(inputs.nuGetReleaseNotesFile).isFile()){
                console.log(`Release notes file: ${inputs.nuGetReleaseNotesFile}`);
                argument("releaseNotesFile", inputs.nuGetReleaseNotesFile, tool);
            }else{
                console.log("No release notes file found");
            }
            return tool;
        },
        multiArgument("include", inputs.include || []),
        flag("verbose", inputs.listFiles)
    ]);
}

export const getInputs = (): PackageInputs => {
    return {
        packageId : tasks.getInput("PackageId", true ),
        packageFormat : tasks.getInput("PackageFormat", true),
        packageVersion : tasks.getInput("PackageVersion"),
        outputPath  : utils.safeTrim(tasks.getInput("OutputPath")) || undefined,
        sourcePath  : utils.safeTrim(tasks.getInput("SourcePath")) || undefined,
        nuGetAuthor : tasks.getInput("NuGetAuthor"),
        nuGetTitle : tasks.getInput("NuGetTitle"),
        nuGetDescription : tasks.getInput("NuGetDescription"),
        nuGetReleaseNotes : tasks.getInput("NuGetReleaseNotes"),
        nuGetReleaseNotesFile : tasks.getInput("NuGetReleaseNotesFile", false),
        overwrite : tasks.getBoolInput("Overwrite"),
        include : utils.getLineSeparatedItems(tasks.getInput("Include")),
        listFiles : tasks.getBoolInput("ListFiles")
    }
}

async function run() {
    try {
        const octo = utils.getOctoCommandRunner("pack");
        const configureTool = configure(getInputs());
        const code: number = await configureTool(octo).exec();

        tasks.setResult(tasks.TaskResult.Succeeded, "Pack succeeded with code " + code);
    }catch(err){
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to execute octo pack command. " + err.message);
    }
}

run();