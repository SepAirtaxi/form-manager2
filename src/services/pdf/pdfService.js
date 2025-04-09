import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  
  // Track current page for headers and footers
  let currentPage = 1;
  
  // Add event handler for page changes
  pdf.setPage = function(n) {
    currentPage = n;
    this.internal.getCurrentPageInfo().pageNumber = n;
    return this;
  };
  
  // Add event handler before adding a new page
  const originalAddPage = pdf.addPage;
  pdf.addPage = function() {
    originalAddPage.call(this);
    currentPage++;
    
    // If headers should be shown on all pages, add them
    if (form.headerOnAllPages) {
      addHeader();
    }
    
    // Always add footer
    addFooter();
    
    return this;
  };
  
  // Helper function to add header
  const addHeader = () => {
    // Save current position and font
    const fontStyle = pdf.getFont();
    const fontSize = pdf.getFontSize();
    
    // Set header style
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    
    // Add company name
    pdf.text(companySettings.name || 'Copenhagen AirTaxi', margin, margin);
    
    // Add form title
    pdf.text(`${form.title} (Rev. ${form.revision})`, pdf.internal.pageSize.width - margin, margin, { 
      align: 'right' 
    });
    
    // If company logo exists, add it
    if (companySettings.logo) {
      try {
        pdf.addImage(
          companySettings.logo, 
          'JPEG', 
          margin, 
          margin + 5, 
          40, 
          20
        );
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    }
    
    // Add a horizontal line under the header
    pdf.setLineWidth(0.5);
    pdf.line(
      margin, 
      margin + 25, 
      pdf.internal.pageSize.width - margin, 
      margin + 25
    );
    
    // Restore font settings
    pdf.setFont(fontStyle.fontName, fontStyle.fontStyle);
    pdf.setFontSize(fontSize);
  };
  
  // Helper function to add footer
  const addFooter = () => {
    // Save current position and font
    const fontStyle = pdf.getFont();
    const fontSize = pdf.getFontSize();
    
    // Set footer style
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    // Page number
    pdf.text(
      `Page ${currentPage} of ${pdf.internal.getNumberOfPages()}`,
      pdf.internal.pageSize.width - margin,
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
    
    // Restore font settings
    pdf.setFont(fontStyle.fontName, fontStyle.fontStyle);
    pdf.setFontSize(fontSize);
  };
  
  // Add header to first page
  addHeader();
  
  // Start position for content (below header)
  let yPos = margin + 35;
  
  // Add form information
  if (form.department) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Department: ${form.department}`, margin, yPos);
    yPos += 10;
  }
  
  // Helper function to add a section header
  const addSectionHeader = (section, path) => {
    // Add section title with path
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    
    // Check if we need a page break
    if (yPos > pdf.internal.pageSize.height - margin * 2) {
      pdf.addPage();
      yPos = margin + 35; // Reset position after header
    }
    
    pdf.text(`${path} ${section.title}`, margin, yPos);
    yPos += 8;
    
    // Add section description if available
    if (section.description) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(10);
      pdf.text(section.description, margin, yPos);
      yPos += 10;
    } else {
      yPos += 5;
    }
  };
  
  // Helper function to add a field
  const addField = (field, path) => {
    // Create a table for this field
    const fieldData = [
      [
        { content: `${path} ${field.title}`, styles: { fontStyle: 'bold' } },
        { content: renderFieldValue(field, formData), styles: { halign: 'left' } }
      ]
    ];
    
    // Add the table
    pdf.autoTable({
      startY: yPos,
      body: fieldData,
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
      styles: {
        cellPadding: 5,
        fontSize: 10
      },
      columnStyles: {
        0: { cellWidth: 80 }, // Label column width
        1: { cellWidth: 'auto' } // Value column stretches
      }
    });
    
    // Update position
    yPos = pdf.lastAutoTable.finalY + 5;
  };
  
  // Helper function to render field value based on type
  const renderFieldValue = (field, data) => {
    const fieldValue = data[field.id];
    
    switch (field.fieldType) {
      case 'checkbox':
        return fieldValue ? 'Yes' : 'No';
      
      case 'radio':
      case 'dropdown':
        return fieldValue || '';
      
      case 'multiCheckbox':
        if (Array.isArray(fieldValue)) {
          return fieldValue.join(', ');
        }
        return '';
      
      case 'signature':
        // Placeholder for signature
        return '[Signature]';
      
      default:
        return fieldValue || '';
    }
  };
  
  // Recursive function to process blocks
  const processBlocks = (blocks, parentPath = '') => {
    blocks.forEach((block, index) => {
      const path = parentPath ? `${parentPath}.${index + 1}` : `${index + 1}`;
      
      if (block.type === 'section') {
        addSectionHeader(block, path);
        
        // Process children
        if (block.children && block.children.length > 0) {
          processBlocks(block.children, path);
        }
      } else if (block.type === 'field') {
        addField(block, path);
      }
    });
  };
  
  // Process all blocks
  processBlocks(form.blocks);
  
  // Add footer to the first page
  addFooter();
  
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
    title: 'Test Form',
    description: 'A sample form for testing PDF generation',
    department: 'Test Department',
    revision: '1.0',
    headerOnAllPages: true,
    blocks: [
      {
        id: 'section1',
        type: 'section',
        title: 'Basic Information',
        description: 'Enter basic information about the aircraft',
        level: 1,
        children: [
          {
            id: 'field1',
            type: 'field',
            title: 'Aircraft Registration',
            fieldType: 'text',
            level: 2
          },
          {
            id: 'field2',
            type: 'field',
            title: 'Aircraft Type',
            fieldType: 'text',
            level: 2
          },
          {
            id: 'field3',
            type: 'field',
            title: 'Date of Inspection',
            fieldType: 'date',
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
              }
            ]
          }
        ]
      },
      {
        id: 'section2',
        type: 'section',
        title: 'Inspection Details',
        description: 'Record inspection findings',
        level: 1,
        children: [
          {
            id: 'field6',
            type: 'field',
            title: 'Oil Leaks Present',
            fieldType: 'checkbox',
            level: 2
          },
          {
            id: 'field7',
            type: 'field',
            title: 'Condition',
            fieldType: 'radio',
            choices: ['Excellent', 'Good', 'Fair', 'Poor'],
            level: 2
          },
          {
            id: 'field8',
            type: 'field',
            title: 'Notes',
            fieldType: 'textarea',
            level: 2
          }
        ]
      },
      {
        id: 'section3',
        type: 'section',
        title: 'Certification',
        description: '',
        level: 1,
        children: [
          {
            id: 'field9',
            type: 'field',
            title: 'Inspected By',
            fieldType: 'text',
            level: 2
          },
          {
            id: 'field10',
            type: 'field',
            title: 'Signature',
            fieldType: 'signature',
            level: 2
          }
        ]
      }
    ]
  };
  
  // Sample form data
  const testData = {
    field1: 'OY-ABC',
    field2: 'Cessna 172',
    field3: '2023-05-01',
    field4: 'Lycoming IO-360',
    field5: '1250',
    field6: true,
    field7: 'Good',
    field8: 'Minor oil seepage at cylinder 3. Recommend monitoring.',
    field9: 'John Doe',
    field10: null
  };
  
  return generateFormPDF(testForm, testData, companySettings);
};

/**
 * Saves a PDF document
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