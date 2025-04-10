import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Generates a PDF from a form
 * @param {Object} form - The form object with blocks
 * @param {Object} formData - The form data (user input)
 * @param {Object} companySettings - Company information for header
 * @returns {jsPDF} The generated PDF document
 */
export const generateFormPDF = (form, formData = {}, companySettings = {}) => {
  const pdf = new jsPDF();
  
  // Set default margins
  const margin = 15;
  const pageWidth = pdf.internal.pageSize.width;
  const contentWidth = pageWidth - (margin * 2);
  
  // Track current page for headers and footers
  let currentPage = 1;
  let totalPages = 1; // Will be updated after content is added
  
  // Set font sizes
  const titleFontSize = 12;
  const sectionFontSize = 11;
  const regularFontSize = 10;
  const smallFontSize = 9;
  
  // Colors for section headers and text
  const sectionHeaderColor = [240, 240, 240]; // Light gray
  const sectionNumberColor = [100, 100, 100]; // Mid/dark gray for section numbers
  
  // Helper function for adding page number footer to all pages
  const addFooter = (pageNum) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(smallFontSize);
    
    // Page number
    pdf.text(
      `Page ${pageNum} of ${totalPages}`,
      pageWidth - margin,
      pdf.internal.pageSize.height - margin,
      { align: 'right' }
    );
    
    // Legal text if available
    if (companySettings.legalText) {
      pdf.text(
        companySettings.legalText,
        margin,
        pdf.internal.pageSize.height - margin
      );
    }
  };
  
  // Add header to the page
  const addHeader = (pageNum) => {
    // Skip if not first page and header not requested on all pages
    if (pageNum > 1 && !form.headerOnAllPages) {
      return margin + 5; // Less space on continuation pages
    }
    
    // Start Y position
    let yPos = margin;
    
    // Create header table with company info and meta data
    const headerData = [];
    
    // Company information row
    const companyRow = [];
    
    // Company name on left
    companyRow.push(companySettings.name || 'Copenhagen AirTaxi');
    
    // Form title in center (with cont. marker if needed)
    companyRow.push(`${form.title}${pageNum > 1 ? ' (cont.)' : ''}`);
    
    // Empty cell for logo position
    companyRow.push('');
    
    headerData.push(companyRow);
    
    // Meta information row (revision, department, date)
    let metaText = `Revision: ${form.revision}`;
    if (form.department) {
      metaText += `   Department: ${form.department}`;
    }
    
    // Add submission date if available
    let dateText = '';
    if (formData.submissionDate) {
      try {
        const submissionDate = formData.submissionDate.toDate 
          ? format(formData.submissionDate.toDate(), 'dd MMM yyyy HH:mm') 
          : format(new Date(formData.submissionDate), 'dd MMM yyyy HH:mm');
        
        dateText = `Date: ${submissionDate}`;
      } catch (e) {
        console.error('Error formatting submission date:', e);
      }
    } else if (formData.submittedAt) {
      try {
        const submissionDate = formData.submittedAt.toDate
          ? format(formData.submittedAt.toDate(), 'dd MMM yyyy HH:mm')
          : format(new Date(formData.submittedAt), 'dd MMM yyyy HH:mm');
          
        dateText = `Date: ${submissionDate}`;
      } catch (e) {
        console.error('Error formatting submission date:', e);
      }
    }
    
    // Add meta information row (single cell spanning width)
    headerData.push([{ content: `${metaText}   ${dateText}`, colSpan: 3 }]);
    
    // Render header table
    pdf.autoTable({
      startY: yPos,
      head: [],
      body: headerData,
      theme: 'plain', // No borders for header
      styles: {
        cellPadding: 3,
        fontSize: titleFontSize,
        halign: 'center',
        valign: 'middle',
        minCellHeight: 15
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },  // Company name left aligned
        1: { halign: 'center' },                   // Title center aligned
        2: { halign: 'right', cellWidth: 60 }      // Logo right aligned
      },
      didDrawCell: function(data) {
        // Add logo to the 3rd cell of the first row
        if (data.row.index === 0 && data.column.index === 2 && companySettings.logo) {
          try {
            // Calculate aspect ratio-preserving dimensions
            const logoMaxWidth = 60;
            const logoMaxHeight = 25;
            
            // Create a temp image to get dimensions
            const img = new Image();
            img.src = companySettings.logo;
            
            // Calculate dimensions preserving aspect ratio
            let logoWidth = logoMaxWidth;
            let logoHeight = logoMaxHeight;
            
            if (img.width && img.height) {
              const aspectRatio = img.width / img.height;
              
              // Adjust dimensions based on aspect ratio
              if (aspectRatio > 1) {
                // Width-constrained
                logoWidth = logoMaxWidth;
                logoHeight = logoWidth / aspectRatio;
              } else {
                // Height-constrained
                logoHeight = logoMaxHeight;
                logoWidth = logoHeight * aspectRatio;
              }
            }
            
            // Position logo at the right side of the header
            const logoX = data.cell.x + data.cell.width - logoWidth - 5;
            const logoY = data.cell.y + (data.cell.height - logoHeight) / 2;
            
            pdf.addImage(
              companySettings.logo, 
              'JPEG', 
              logoX, 
              logoY, 
              logoWidth, 
              logoHeight
            );
          } catch (error) {
            console.error('Error adding logo to PDF:', error);
          }
        }
      },
      margin: { left: margin, right: margin }
    });
    
    // Update yPos after header table
    yPos = pdf.lastAutoTable.finalY + 5;
    
    // Add additional company info if available - address, contact, VAT, etc.
    if (companySettings.address || companySettings.contact || 
        companySettings.vatNumber || companySettings.easaNumber) {
      
      const companyInfoData = [];
      const companyInfoRow = [];
      
      // Format company details
      let addressInfo = '';
      if (companySettings.address) {
        addressInfo += companySettings.address;
      }
      
      let contactInfo = '';
      if (companySettings.contact) {
        contactInfo += companySettings.contact;
      }
      
      let regInfo = '';
      if (companySettings.vatNumber) {
        regInfo += `VAT: ${companySettings.vatNumber}`;
      }
      if (companySettings.easaNumber) {
        if (regInfo) regInfo += '   ';
        regInfo += `EASA: ${companySettings.easaNumber}`;
      }
      
      // Add info to the row
      companyInfoRow.push(addressInfo);
      companyInfoRow.push(contactInfo);
      companyInfoRow.push(regInfo);
      
      // Only add the row if there's any info
      if (addressInfo || contactInfo || regInfo) {
        companyInfoData.push(companyInfoRow);
        
        // Render company info table
        pdf.autoTable({
          startY: yPos,
          head: [],
          body: companyInfoData,
          theme: 'plain', // No borders for info
          styles: {
            cellPadding: 2,
            fontSize: smallFontSize,
            halign: 'center',
            minCellHeight: 8
          },
          columnStyles: {
            0: { halign: 'left' },    // Address left aligned
            1: { halign: 'center' },  // Contact center aligned
            2: { halign: 'right' }    // Registration info right aligned
          },
          margin: { left: margin, right: margin }
        });
        
        yPos = pdf.lastAutoTable.finalY + 5;
      }
    }
    
    return yPos; // Return the Y position after the header
  };
  
  // Format field value based on type
  const formatFieldValue = (field, value) => {
    if (value === undefined || value === null || value === '') {
      return '';
    }
    
    switch (field.fieldType) {
      case 'checkbox':
        return value === true ? 'Yes' : 'No';
        
      case 'radio':
        return value.toString();
        
      case 'multiCheckbox':
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return '';
        
      case 'date':
        try {
          // Handle possible date formats
          if (value instanceof Date) {
            return format(value, 'dd MMM yyyy');
          } else if (typeof value === 'string') {
            return value;
          }
          return '';
        } catch (e) {
          return value.toString();
        }
        
      default:
        return value.toString();
    }
  };
  
  // Find field by ID (recursive)
  const findField = (fieldId, blocks) => {
    for (const block of blocks) {
      if (block.type === 'field' && block.id === fieldId) {
        return block;
      }
      
      if (block.children && block.children.length > 0) {
        const foundField = findField(fieldId, block.children);
        if (foundField) return foundField;
      }
    }
    return null;
  };
  
  // Helper function to analyze the form and determine optimal column widths
  const analyzeFormStructure = (blocks) => {
    // Store the widest label at each level
    let widestLabels = {
      fields: { text: '', length: 0 },
      sections: { text: '', length: 0 }
    };
    
    // Analyze the structure recursively
    const analyzeBlock = (block, path) => {
      const fullPath = path ? `${path} ${block.title}` : block.title;
      
      if (block.type === 'section') {
        if (fullPath.length > widestLabels.sections.length) {
          widestLabels.sections = { text: fullPath, length: fullPath.length };
        }
      } else if (block.type === 'field') {
        if (fullPath.length > widestLabels.fields.length) {
          widestLabels.fields = { text: fullPath, length: fullPath.length };
        }
      }
      
      if (block.children && block.children.length > 0) {
        block.children.forEach((child, idx) => {
          const childPath = path ? `${path}.${idx + 1}` : `${idx + 1}`;
          analyzeBlock(child, childPath);
        });
      }
    };
    
    // Start analysis from top-level blocks
    blocks.forEach((block, idx) => {
      analyzeBlock(block, `${idx + 1}`);
    });
    
    // Calculate optimal field label width (each character is ~0.5% of width)
    // Ensure it's at least 35% and at most 60% of content width
    const fieldLabelWidthPercent = Math.max(0.35, Math.min(0.60, 0.25 + (widestLabels.fields.length * 0.005)));
    
    return {
      fieldLabelWidth: fieldLabelWidthPercent,
      widestFieldLabel: widestLabels.fields.text,
      widestSectionLabel: widestLabels.sections.text
    };
  };
  
  // Format section title with path number in gray
  const formatSectionTitle = (path, title) => {
    return {
      content: title,
      prefix: path,
      isFormattedTitle: true
    };
  };

  // Main function to process and render all form blocks
  const renderForm = () => {
    let startY = addHeader(currentPage);
    
    // Analyze form to determine optimal column widths
    const formAnalysis = analyzeFormStructure(form.blocks);
    const fieldLabelWidth = formAnalysis.fieldLabelWidth;
    
    // Process each top-level section
    form.blocks.forEach((section, sectionIndex) => {
      if (section.type !== 'section') return;
      
      // Add spacing between sections
      if (sectionIndex > 0) {
        startY += 5;
      }
      
      // Check if we need a page break before this section
      if (startY > pdf.internal.pageSize.height - 50) {
        pdf.addPage();
        currentPage++;
        startY = addHeader(currentPage);
      }
      
      // Generate table data for this entire section including all nested content
      const tableData = [];
      
      // Add section header row
      const sectionPath = sectionIndex + 1;
      tableData.push([
        { 
          content: formatSectionTitle(`${sectionPath}`, section.title),
          colSpan: 2,
          isSection: true,
          sectionLevel: 1,
          centerText: true
        }
      ]);
      
      // Add section description if present
      if (section.description) {
        tableData.push([
          { 
            content: section.description, 
            colSpan: 2,
            isDescription: true,
            sectionLevel: 1
          }
        ]);
      }
      
      // Process content recursively
      processContent(section, tableData, sectionPath, 1);
      
      // Render section table
      pdf.autoTable({
        startY: startY,
        head: [],
        body: tableData,
        theme: 'grid',
        styles: {
          cellPadding: {top: 2, right: 5, bottom: 2, left: 5},
          fontSize: regularFontSize,
          lineWidth: 0.1,
          lineColor: [180, 180, 180],
          minCellHeight: 6,
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: contentWidth * fieldLabelWidth },
          1: { cellWidth: contentWidth * (1 - fieldLabelWidth) }
        },
        margin: { left: margin, right: margin },
        didDrawCell: function(data) {
          // Apply styling to specific cell types
          if (data.cell.raw) {
            // For section headers with centered text
            if ((data.cell.raw.isSection || data.cell.raw.isSubSection) && data.cell.raw.centerText) {
              // Fill with section header color
              pdf.setFillColor.apply(pdf, sectionHeaderColor);
              pdf.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
              
              // Re-draw border lines (to ensure all borders are visible)
              pdf.setDrawColor(180, 180, 180);
              pdf.setLineWidth(0.1);
              pdf.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y); // Top
              pdf.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height); // Bottom
              pdf.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height); // Left
              pdf.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height); // Right
              
              // Re-draw the text with formatted section number and title
              if (data.cell.raw.content && data.cell.raw.content.isFormattedTitle) {
                const title = data.cell.raw.content.content;
                const prefix = data.cell.raw.content.prefix;
                
                // Set styles for section title
                pdf.setTextColor(0, 0, 0);
                pdf.setFont('helvetica', 'bold');
                
                // Adjust font size based on section level
                if (data.cell.raw.sectionLevel === 1) {
                  pdf.setFontSize(sectionFontSize + 1); // Slightly larger for top level
                } else {
                  pdf.setFontSize(regularFontSize);
                }
                
                // Calculate center position
                const fullText = `${prefix} ${title}`;
                const textWidth = pdf.getStringUnitWidth(fullText) * pdf.getFontSize() / pdf.internal.scaleFactor;
                const textX = data.cell.x + (data.cell.width - textWidth) / 2;
                const textY = data.cell.y + data.cell.height / 2 + 1; // +1 for better vertical centering
                
                // Draw section number in gray
                pdf.setTextColor.apply(pdf, sectionNumberColor);
                pdf.text(prefix, textX, textY);
                
                // Calculate position for title (after prefix)
                const prefixWidth = pdf.getStringUnitWidth(prefix + ' ') * pdf.getFontSize() / pdf.internal.scaleFactor;
                
                // Draw title in black
                pdf.setTextColor(0, 0, 0);
                pdf.text(title, textX + prefixWidth, textY);
              }
            }
          }
        },
        didParseCell: function(data) {
          // Set cell styles based on type
          if (data.cell.raw) {
            if (data.cell.raw.isSection || data.cell.raw.isSubSection) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = sectionHeaderColor;
              data.cell.styles.halign = 'center'; // Center all section headers
              
              // Adjust font size for top-level sections
              if (data.cell.raw.sectionLevel === 1) {
                data.cell.styles.fontSize = sectionFontSize + 1;
              }
            } 
            else if (data.cell.raw.isDescription) {
              data.cell.styles.fontStyle = 'italic';
              data.cell.styles.fontSize = smallFontSize;
              data.cell.styles.cellPadding = {top: 1, right: 5, bottom: 3, left: 5};
              
              if (data.cell.raw.sectionLevel > 1) {
                data.cell.styles.fillColor = [245, 245, 245]; // Very light gray
              }
            }
            else if (data.cell.raw.isField && data.column.index === 0) {
              // Handle field label formatting with gray number
              if (data.cell.raw.content && data.cell.raw.content.isFormattedTitle) {
                // Handle in didDrawCell
              } else {
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
          
          // Make sure text is properly set
          if (data.cell.raw && data.cell.raw.content) {
            if (data.cell.raw.content.isFormattedTitle) {
              // This will be handled in didDrawCell
              data.cell.text = [`${data.cell.raw.content.prefix} ${data.cell.raw.content.content}`];
            } else {
              data.cell.text = [data.cell.raw.content];
            }
          }
        }
      });
      
      startY = pdf.lastAutoTable.finalY + 3;
    });
    
    // Calculate total pages
    totalPages = pdf.internal.getNumberOfPages();
    
    // Add footers to all pages
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter(i);
    }
  };
  
  // Process content recursively for table data
  const processContent = (section, tableData, path, level) => {
    if (!section.children) return;
    
    // First process subsections with their fields
    section.children.forEach((child, index) => {
      const childPath = `${path}.${index + 1}`;
      
      if (child.type === 'section') {
        // Add subsection header row
        tableData.push([
          { 
            content: formatSectionTitle(childPath, child.title),
            colSpan: 2,
            isSubSection: true,
            sectionLevel: level + 1,
            centerText: true
          }
        ]);
        
        // Add subsection description if present
        if (child.description) {
          tableData.push([
            { 
              content: child.description, 
              colSpan: 2,
              isDescription: true,
              sectionLevel: level + 1
            }
          ]);
        }
        
        // Process subsection content recursively
        processContent(child, tableData, childPath, level + 1);
      } 
      else if (child.type === 'field') {
        // Add field row with formatted title
        const fieldValue = formData[child.id];
        tableData.push([
          { 
            content: formatSectionTitle(childPath, `${child.title}${child.required ? ' *' : ''}`),
            isField: true,
            fieldType: child.fieldType,
            sectionLevel: level
          },
          { 
            content: formatFieldValue(child, fieldValue),
            fieldValue: true,
            fieldType: child.fieldType,
            sectionLevel: level
          }
        ]);
      }
    });
  };
  
  // Generate the form
  renderForm();
  
  return pdf;
};

/**
 * Generates a test PDF with sample data
 * @param {Object} companySettings - Company information for header
 * @returns {jsPDF} The generated test PDF
 */
export const generateTestPDF = (companySettings = {}) => {
  // Create a sample form with various field types
  const testForm = {
    title: 'Aircraft Inspection Form',
    description: 'Pre-flight and post-flight inspection checklist',
    department: 'Maintenance',
    revision: '2.1',
    headerOnAllPages: true,
    blocks: [
      {
        id: 'section1',
        type: 'section',
        title: 'Aircraft Information',
        description: 'Enter basic information about the aircraft',
        level: 1,
        children: [
          {
            id: 'field1',
            type: 'field',
            title: 'Aircraft Registration',
            fieldType: 'text',
            required: true,
            level: 2
          },
          {
            id: 'field2',
            type: 'field',
            title: 'Aircraft Type',
            fieldType: 'text',
            required: true,
            level: 2
          },
          {
            id: 'field3',
            type: 'field',
            title: 'Date of Inspection',
            fieldType: 'date',
            required: true,
            level: 2
          },
          {
            id: 'section1.1',
            type: 'section',
            title: 'Engine Information',
            description: 'Enter engine details',
            level: 2,
            children: [
              {
                id: 'field4',
                type: 'field',
                title: 'Engine Model',
                fieldType: 'text',
                level: 3
              },
              {
                id: 'field5',
                type: 'field',
                title: 'Hours Since Overhaul',
                fieldType: 'number',
                level: 3
              },
              {
                id: 'field6',
                type: 'field',
                title: 'Oil Level Check',
                fieldType: 'checkbox',
                required: true,
                level: 3
              }
            ]
          }
        ]
      },
      {
        id: 'section2',
        type: 'section',
        title: 'Pre-Flight Inspection',
        description: 'Check all items before flight',
        level: 1,
        children: [
          {
            id: 'section2.1',
            type: 'section',
            title: 'External Inspection',
            level: 2,
            children: [
              {
                id: 'field7',
                type: 'field',
                title: 'Airframe Condition',
                fieldType: 'radio',
                choices: ['Excellent', 'Good', 'Fair', 'Poor'],
                required: true,
                level: 3
              },
              {
                id: 'field8',
                type: 'field',
                title: 'Control Surfaces',
                fieldType: 'multiCheckbox',
                choices: ['Ailerons', 'Elevator', 'Rudder', 'Flap'],
                required: true,
                level: 3
              },
              {
                id: 'field9',
                type: 'field',
                title: 'Landing Gear',
                fieldType: 'checkbox',
                required: true,
                level: 3
              }
            ]
          },
          {
            id: 'section2.2',
            type: 'section',
            title: 'Cockpit Inspection',
            level: 2,
            children: [
              {
                id: 'field10',
                type: 'field',
                title: 'Instruments',
                fieldType: 'checkbox',
                required: true,
                level: 3
              },
              {
                id: 'field11',
                type: 'field',
                title: 'Radio Equipment',
                fieldType: 'checkbox',
                required: true,
                level: 3
              }
            ]
          }
        ]
      },
      {
        id: 'section3',
        type: 'section',
        title: 'Additional Notes',
        level: 1,
        children: [
          {
            id: 'section3.1',
            type: 'section',
            title: 'Notes',
            level: 2,
            children: [
              {
                id: 'field12',
                type: 'field',
                title: 'Notes',
                fieldType: 'textarea',
                level: 3
              }
            ]
          }
        ]
      },
      {
        id: 'section4',
        type: 'section',
        title: 'Certification',
        level: 1,
        children: [
          {
            id: 'field13',
            type: 'field',
            title: 'Inspector Name',
            fieldType: 'text',
            required: true,
            level: 2
          },
          {
            id: 'field14',
            type: 'field',
            title: 'Certification Number',
            fieldType: 'text',
            required: true,
            level: 2
          },
          {
            id: 'field15',
            type: 'field',
            title: 'Signature',
            fieldType: 'signature',
            required: true,
            level: 2
          }
        ]
      }
    ]
  };
  
  // Sample form data
  const testData = {
    field1: 'OY-ABC',
    field2: 'Cessna 172 Skyhawk',
    field3: '15 Apr 2023',
    field4: 'Lycoming O-320-D2J',
    field5: '345',
    field6: true,
    field7: 'Good',
    field8: ['Ailerons', 'Elevator', 'Rudder', 'Flap'],
    field9: true,
    field10: true,
    field11: true,
    field12: 'Minor surface scratches on left wing tip. All systems functioning normally. Recommended to check oil pressure gauge on next maintenance.',
    field13: 'John Doe',
    field14: 'DK-AME-1234',
    field15: 'Signed: John Doe',
    submissionDate: new Date('2025-04-10T10:12:00')
  };
  
  return generateFormPDF(testForm, testData, companySettings);
};

/**
 * Saves a PDF document to the user's device
 * @param {jsPDF} pdf - The PDF document
 * @param {string} filename - The filename to save as
 */
export const savePDF = (pdf, filename) => {
  pdf.save(filename);
};

/**
 * Opens a PDF in a new tab
 * @param {jsPDF} pdf - The PDF document
 */
export const openPDF = (pdf) => {
  window.open(pdf.output('bloburl'), '_blank');
};