import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CirclePlus } from 'lucide-react'; // Spinner icon
import { Button } from '@/components/ui/Button';
import { useDocumentStore } from '@/stores/documentStore';
import navbarLogo from "@/assets/navbarLogo.png";

export default function Navbar() {
  const navigate = useNavigate()
  const { uploadDocument } = useDocumentStore()

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Simulate async API call – replace this with your actual API
      const formData = new FormData();
      formData.append('file', file);

      // Replace this line with: await uploadDocument(formData);
    //   await new Promise((resolve) => setTimeout(resolve, 2000));
      const newDocument = await uploadDocument(formData)
      
      navigate(`/document/${newDocument.id}`)

      console.log('File uploaded:', file.name);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Allow uploading the same file again
    }
  };

  return (
    <nav className="flex justify-around items-center px-[40px] py-[20px] fixed top-0 w-full" style={{ boxShadow: "0px 3px 10px 0px rgba(0,0,0,0.26)" }}>
      <img src={navbarLogo} alt="navbar logo" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf" // optional: restrict file types
      />
      <Button onClick={handleFileClick} disabled={isUploading} className='border-2 border-primary  text-primary bg-white hover:bg-gray-200'>
        {isUploading ? (
          <>
            <Loader2 className="animate-spin mr-2 h-4 w-4" />
            Uploading...
          </>
        ) : (
          <>
            <CirclePlus color="#000000" />
            Upload PDF
          </>
        )}
      </Button>
    </nav>
  );
}
