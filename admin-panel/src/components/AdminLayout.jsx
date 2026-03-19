import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './AdminLayout.css';

export default function AdminLayout({ children, title }) {
    return (
        <div className="admin-layout">
            <Sidebar />
            <div className="admin-layout-main">
                <TopBar title={title} />
                <main className="admin-layout-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
