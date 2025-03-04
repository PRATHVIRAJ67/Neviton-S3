import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import AWS from 'aws-sdk';
import { Box, Button } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UploadToS3 = () => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [progress, setProgress] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const savedProgress = JSON.parse(localStorage.getItem('uploadProgress'));
    if (savedProgress) {
      setProgress(savedProgress);
    }
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    toast.info('Upload in progress...');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        setData(worksheet);

        AWS.config.logger = console;

        const s3 = new AWS.S3({
          accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
          region: process.env.REACT_APP_AWS_REGION,
        });

        for (let i = progress.lastProcessedIndex || 0; i < worksheet.length; i++) {
          const { Name, File_Link } = worksheet[i];
          const response = await axios.get(File_Link, { responseType: 'blob' });
          const blob = response.data;

          const params = {
            Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
            Key: Name,
            Body: blob,
            ContentType: blob.type,
          };

          const uploadResult = await s3.upload(params).promise();
          worksheet[i].s3_url = uploadResult.Location;

          setProgress((prev) => ({ ...prev, lastProcessedIndex: i + 1 }));
          localStorage.setItem('uploadProgress', JSON.stringify({ ...progress, lastProcessedIndex: i + 1 }));
        }

        const newWorkbook = XLSX.utils.book_new();
        const newWorksheet = XLSX.utils.json_to_sheet(worksheet);
        XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Sheet1');
        XLSX.writeFile(newWorkbook, 'updated_excel_file.xlsx');

        localStorage.removeItem('uploadProgress');
        toast.success('Upload completed successfully!');
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
      <input type="file" onChange={handleFileChange} style={{ marginBottom: '20px' }} />
      <Button variant="contained" color="primary" onClick={handleUpload} disabled={uploading}>
        Submit
      </Button>
      <ToastContainer />
    </Box>
  );
};

export default UploadToS3;