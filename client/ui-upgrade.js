const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components');
const files = ['Jobs.js', 'Questions.js', 'Alumni.js', 'Register.js', 'Login.js', 'JobDetail.js', 'QuestionDetail.js'];

files.forEach(f => {
  const p = path.join(dir, f);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Convert Cards
    content = content.replace(/bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition/g, 'bg-white rounded-xl shadow-md hover:shadow-lg transition p-6');
    content = content.replace(/bg-white rounded-lg shadow-lg p-6/g, 'bg-white rounded-xl shadow-md hover:shadow-lg transition p-6');
    content = content.replace(/bg-white rounded-lg shadow-lg/g, 'bg-white rounded-xl shadow-md');
    
    // Typography Headers
    content = content.replace(/text-4xl font-bold text-gray-800/g, 'text-3xl font-bold');
    content = content.replace(/text-4xl font-bold/g, 'text-3xl font-bold');
    
    // Fix buttons across specific variations seen in the previous grep searches
    content = content.replace(/bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded/g, 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition');
    content = content.replace(/bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg/g, 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition');
    content = content.replace(/bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded/g, 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition');
    content = content.replace(/bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg/g, 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition');
    content = content.replace(/bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded/g, 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition');
    content = content.replace(/bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg/g, 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition');
    content = content.replace(/w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg/g, 'w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition');
    content = content.replace(/mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded/g, 'mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition');
    
    content = content.replace(/bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded/g, 'bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition');
    content = content.replace(/bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg/g, 'bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition');
    content = content.replace(/flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg/g, 'flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition');
    content = content.replace(/w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg/g, 'w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition');

    fs.writeFileSync(p, content, 'utf8');
    console.log('Processed ' + f);
  } else {
    console.log('NOT FOUND ' + f);
  }
});
