const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src', 'app'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Fix { params }: { params: { id: string } } -> { params }: { params: Promise<{ id: string }> }
  // and add const { id } = await params;
  if (content.includes('export default async function') && content.includes('{ params }:') && content.includes('{ id: string')) {
    content = content.replace(/\{ params \}:\s*\{\s*params:\s*\{\s*(id|billId):\s*string;?\s*(?:billId:\s*string)?\s*\}\s*\}/g, (match) => {
       if(match.includes('billId')) {
           return `{ params }: { params: Promise<{ id: string; billId: string }> }`;
       }
       return `{ params }: { params: Promise<{ id: string }> }`;
    });
    
    // insert await logic after the function declaration
    if (content.includes('export default async function')) {
      content = content.replace(/(export default async function [a-zA-Z0-9_]+\s*\([^)]*\)\s*\{)/, (match) => {
         if (content.includes('billId: string')) {
             return `${match}\n  const { id, billId } = await params;`;
         } else if (content.includes('id: string')) {
             // check if it's already there
             if (!content.includes('const { id } = await params;')) {
                 return `${match}\n  const { id } = await params;`;
             }
         }
         return match;
      });
    }

    // replace params.id with id
    content = content.replace(/params\.id/g, 'id');
    content = content.replace(/params\.billId/g, 'billId');
    changed = true;
  }
  
  // Also for Route Handlers (API routes)
  if (content.includes('export async function GET') || content.includes('export async function POST')) {
    if (content.includes('{ params }:') && content.includes('{ id: string')) {
        content = content.replace(/\{ params \}:\s*\{\s*params:\s*\{\s*id:\s*string\s*\}\s*\}/g, `{ params }: { params: Promise<{ id: string }> }`);
        content = content.replace(/(export async function [A-Z]+\s*\([^)]*\)\s*\{)/, (match) => {
            if (!content.includes('const { id } = await params;')) {
                return `${match}\n  const { id } = await params;`;
            }
            return match;
        });
        content = content.replace(/params\.id/g, 'id');
        changed = true;
    }
  }

  // 2. searchParams
  if (content.includes('searchParams') && content.includes('export default async function')) {
     if (content.includes('{ searchParams }:') || content.includes('searchParams:')) {
         content = content.replace(/\{\s*searchParams\s*\}:\s*\{\s*searchParams:\s*\{\s*[a-zA-Z0-9_]+:\s*string\s*\}\s*\}/g, `{ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }`);
         content = content.replace(/(export default async function [a-zA-Z0-9_]+\s*\([^)]*\)\s*\{)/, (match) => {
            if (!content.includes('const resolvedSearchParams = await searchParams;')) {
                return `${match}\n  const resolvedSearchParams = await searchParams;`;
            }
            return match;
         });
         content = content.replace(/searchParams\.([a-zA-Z0-9_]+)/g, 'resolvedSearchParams.$1');
         changed = true;
     }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
