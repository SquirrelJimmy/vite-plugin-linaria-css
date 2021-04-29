/**
 * This file contains a Rollup loader for Linaria.
 * It uses the transform.ts function to generate class names from source code,
 * returns transformed code without template literals and attaches generated source maps
 */
 import fs from "fs";
 import path from "path";
 import { Plugin } from 'vite';
 import { createFilter } from "@rollup/pluginutils";
 import type { PluginOptions, Preprocessor } from "@linaria/babel-preset";
 import mkdirp from 'mkdirp';
 import normalize from 'normalize-path';
 import findYarnWorkspaceRoot from 'find-yarn-workspace-root';
 import { EvalCache, transform } from '@linaria/babel-preset';
 
 const workspaceRoot = findYarnWorkspaceRoot();
 
 type RollupPluginOptions = {
   include?: string | string[];
   exclude?: string | string[];
   sourceMap?: boolean;
   preprocessor?: Preprocessor;
   extension?: string;
   cacheDirectory?: string;
 } & Partial<PluginOptions>;
 
 
 
 export default function linaria({
   include, 
   exclude,
   sourceMap = undefined,
   cacheDirectory = '.linaria-cache',
   preprocessor = undefined,
   extension = '.linaria.css',
   ...rest
 }: RollupPluginOptions = {}): Plugin {
   const filter = createFilter(include, exclude);
   const cssLookup: { [key: string]: string } = {};
   const root = workspaceRoot  || process.cwd();
   return {
     name: "vite-plugin-linaria",
     load(id: string) {
       return cssLookup[id];
     },
     resolveId(importee: string) {      
       if (importee in cssLookup) return importee;
     },
     // @ts-ignore
     transform(code: string, id: string) {
       // Do not transform ignored and generated files
       if (!filter(id) || id in cssLookup) return;
       EvalCache.clearForFile(id);
       const result = transform(code, {
         filename: id,
         preprocessor,
         pluginOptions: rest,
       });
 
       if (!result.cssText) return;
 
       let { cssText } = result;
       const baseOutputFileName = id.replace(/\.[^.]+$/, extension);
       const outputFilename = normalize(
         path.join(
           path.isAbsolute(cacheDirectory)
             ? cacheDirectory
             : path.join(process.cwd(), cacheDirectory),
           id.includes(root)
             ? path.relative(root, baseOutputFileName)
             : baseOutputFileName
         )
       );
     
       let currentCssText;
       if (!fs.existsSync(baseOutputFileName)) {
         try {
           currentCssText = fs.readFileSync(outputFilename, 'utf-8');
         } catch (e) {
           // Ignore error
         }
       }
 
       if (sourceMap && result.cssSourceMapText) {
         const map = Buffer.from(result.cssSourceMapText).toString("base64");
         cssText += `/*# sourceMappingURL=data:application/json;base64,${map}*/`;
       }
 
       if (currentCssText !== cssText) {
         mkdirp.sync(path.dirname(outputFilename));
         fs.writeFileSync(outputFilename, cssText);
       }
       cssLookup[outputFilename] = cssText;      
       result.code += `\nimport ${JSON.stringify(outputFilename)};\n`;
       /* eslint-disable-next-line consistent-return */
       return { code: result.code, map: result.sourceMap };
     },
   };
 }