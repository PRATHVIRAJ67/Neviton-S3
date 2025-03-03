import React, { useState } from 'react';
import AWS from 'aws-sdk';

function Test() {
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileInput = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const uploadFile = () => {
        if (!selectedFile) {
            alert('Please select a file.');
            return;
        }

        const s3 = new AWS.S3({
            accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
            region: process.env.REACT_APP_AWS_REGION
        });

        const params = {
            Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
            Key: selectedFile.name,
            Body: selectedFile
        };

        s3.upload(params, function(err, data) {
            if (err) {
                console.error('Error uploading file:', err);
                alert('Error uploading file.');
            } else {
                console.log('File uploaded successfully:', data.Location);
                alert('File uploaded successfully.');
            }
        });
    };

    return (
        <div className="App">
            <input type="file" onChange={handleFileInput} />
            <button onClick={uploadFile}>Upload</button>
        </div>
    );
}

export default Test;