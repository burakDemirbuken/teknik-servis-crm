import React, { useState, useEffect } from 'react';
import { Search, Plus, Printer, Send, Package, Users, BarChart3, Settings, LogOut, Home, ChevronRight, Filter, X, Check, Clock, AlertCircle, Archive, Phone, Mail, MapPin, Calendar, Edit2, Trash2, Download, Bell, Lock, User, Smartphone, TrendingUp, TrendingDown, DollarSign, Activity, Save, Eye, EyeOff } from 'lucide-react';

// Mock data
const initialTickets = [
  {
	id: 'TKT-001',
	customerName: 'Ahmet Yılmaz',
	customerPhone: '+90 532 111 2233',
	customerEmail: 'ahmet.yilmaz@email.com',
	device: 'Tefal Blender BL542',
	issue: 'Motor çalışmıyor',
	status: 'pending',
	priority: 'high',
	createdAt: '2024-02-05T10:30:00',
	shelfLocation: 'A-12',
	estimatedCost: 450,
	technician: 'Mehmet Demir',
	notes: 'Motor arızası tespit edildi, yedek parça bekleniyor'
  },
  {
	id: 'TKT-002',
	customerName: 'Zeynep Kaya',
	customerPhone: '+90 533 444 5566',
	customerEmail: 'zeynep.kaya@email.com',
	device: 'Fakir Süpürge Veyron Turbo',
	issue: 'Emme gücü azaldı',
	status: 'in-progress',
	priority: 'medium',
	createdAt: '2024-02-04T14:20:00',
	shelfLocation: 'B-05',
	estimatedCost: 280,
	technician: 'Ali Öztürk',
	notes: 'Filtre değişimi yapılıyor'
  },
  {
	id: 'TKT-003',
	customerName: 'Can Arslan',
	customerPhone: '+90 535 777 8899',
	customerEmail: 'can.arslan@email.com',
	device: 'Philips Kettle HD9350',
	issue: 'Isıtma yapmıyor',
	status: 'completed',
	priority: 'low',
	createdAt: '2024-02-03T09:15:00',
	shelfLocation: 'C-18',
	estimatedCost: 320,
	technician: 'Mehmet Demir',
	completedAt: '2024-02-05T16:00:00',
	notes: 'Termostat değiştirildi, test edildi'
  },
  {
	id: 'TKT-004',
	customerName: 'Ayşe Şahin',
	customerPhone: '+90 536 222 3344',
	customerEmail: 'ayse.sahin@email.com',
	device: 'Arçelik K 1260 Kahve Makinesi',
	issue: 'Su kaçırıyor',
	status: 'waiting-parts',
	priority: 'high',
	createdAt: '2024-02-05T11:45:00',
	shelfLocation: 'A-08',
	estimatedCost: 520,
	technician: 'Ali Öztürk',
	notes: 'Conta ve pompa parçası siparişi verildi'
  },
];

const initialCustomers = [
  { id: 'CUST-001', name: 'Ahmet Yılmaz', phone: '+90 532 111 2233', email: 'ahmet.yilmaz@email.com', address: 'Kadıköy, İstanbul', totalTickets: 3, totalSpent: 1250 },
  { id: 'CUST-002', name: 'Zeynep Kaya', phone: '+90 533 444 5566', email: 'zeynep.kaya@email.com', address: 'Beşiktaş, İstanbul', totalTickets: 1, totalSpent: 280 },
  { id: 'CUST-003', name: 'Can Arslan', phone: '+90 535 777 8899', email: 'can.arslan@email.com', address: 'Çankaya, Ankara', totalTickets: 2, totalSpent: 640 },
  { id: 'CUST-004', name: 'Ayşe Şahin', phone: '+90 536 222 3344', email: 'ayse.sahin@email.com', address: 'Karşıyaka, İzmir', totalTickets: 1, totalSpent: 520 },
];

const shelves = [
  { id: 'A', rows: 20, color: 'bg-blue-500' },
  { id: 'B', rows: 20, color: 'bg-indigo-500' },
  { id: 'C', rows: 20, color: 'bg-cyan-500' },
  { id: 'D', rows: 20, color: 'bg-purple-500' },
];

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [tickets, setTickets] = useState(initialTickets);
  const [customers, setCustomers] = useState(initialCustomers);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showEditTicketModal, setShowEditTicketModal] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState({
	notifications: true,
	emailNotifications: true,
	whatsappNotifications: true,
	autoBackup: true,
  });

  // Stats calculation
  const stats = {
	total: tickets.length,
	pending: tickets.filter(t => t.status === 'pending').length,
	inProgress: tickets.filter(t => t.status === 'in-progress').length,
	completed: tickets.filter(t => t.status === 'completed').length,
	waitingParts: tickets.filter(t => t.status === 'waiting-parts').length,
	totalRevenue: tickets.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.estimatedCost, 0),
	avgTicketValue: tickets.length > 0 ? Math.round(tickets.reduce((sum, t) => sum + t.estimatedCost, 0) / tickets.length) : 0,
  };

  const statusConfig = {
	'pending': { label: 'Beklemede', color: 'bg-yellow-500', icon: Clock },
	'in-progress': { label: 'İşlemde', color: 'bg-blue-500', icon: Settings },
	'waiting-parts': { label: 'Parça Bekleniyor', color: 'bg-orange-500', icon: AlertCircle },
	'completed': { label: 'Tamamlandı', color: 'bg-green-500', icon: Check },
  };

  const priorityConfig = {
	'low': { label: 'Düşük', color: 'text-gray-500' },
	'medium': { label: 'Orta', color: 'text-yellow-600' },
	'high': { label: 'Yüksek', color: 'text-red-600' },
  };

  // Login component
  const LoginPage = () => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);

	const handleLogin = (e) => {
	  e.preventDefault();
	  if (username && password) {
		setCurrentUser({ name: username, role: 'admin' });
		setIsAuthenticated(true);
	  }
	};

	return (
	  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center p-4">
		<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
		
		<div className="relative w-full max-w-md">
		  <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden">
			<div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 h-2"></div>
			
			<div className="p-8 md:p-12">
			  <div className="mb-8">
				<div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 transform rotate-3">
				  <Settings className="w-8 h-8 text-white" />
				</div>
				<h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
				  Teknik Servis CRM
				</h1>
				<p className="text-gray-400">Hoş geldiniz, lütfen giriş yapın</p>
			  </div>

			  <form onSubmit={handleLogin} className="space-y-6">
				<div>
				  <label className="block text-sm font-medium text-gray-300 mb-2">Kullanıcı Adı</label>
				  <input
					type="text"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
					placeholder="kullaniciadi"
					required
				  />
				</div>

				<div>
				  <label className="block text-sm font-medium text-gray-300 mb-2">Şifre</label>
				  <div className="relative">
					<input
					  type={showPassword ? "text" : "password"}
					  value={password}
					  onChange={(e) => setPassword(e.target.value)}
					  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
					  placeholder="••••••••"
					  required
					/>
					<button
					  type="button"
					  onClick={() => setShowPassword(!showPassword)}
					  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
					>
					  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
					</button>
				  </div>
				</div>

				<button
				  type="submit"
				  className="w-full py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
				>
				  Giriş Yap
				</button>
			  </form>

			  <div className="mt-8 pt-6 border-t border-gray-700">
				<p className="text-xs text-gray-500 text-center">
				  Demo: Herhangi bir kullanıcı adı ve şifre ile giriş yapabilirsiniz
				</p>
			  </div>
			</div>
		  </div>
		</div>
	  </div>
	);
  };

  // Sidebar
  const Sidebar = () => {
	const menuItems = [
	  { id: 'dashboard', icon: Home, label: 'Dashboard' },
	  { id: 'tickets', icon: Package, label: 'Ticketlar' },
	  { id: 'shelves', icon: Archive, label: 'Raf Sistemi' },
	  { id: 'customers', icon: Users, label: 'Müşteriler' },
	  { id: 'reports', icon: BarChart3, label: 'Raporlar' },
	  { id: 'settings', icon: Settings, label: 'Ayarlar' },
	];

	return (
	  <div className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-gray-800 h-screen sticky top-0">
		<div className="p-6 border-b border-gray-800">
		  <div className="flex items-center gap-3">
			<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
			  <Settings className="w-5 h-5 text-white" />
			</div>
			<div>
			  <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>TeknikCRM</h2>
			  <p className="text-xs text-gray-500">v1.0</p>
			</div>
		  </div>
		</div>

		<nav className="flex-1 p-4 space-y-2">
		  {menuItems.map((item) => (
			<button
			  key={item.id}
			  onClick={() => setCurrentPage(item.id)}
			  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
				currentPage === item.id
				  ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-white border border-blue-500/30'
				  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
			  }`}
			>
			  <item.icon className="w-5 h-5" />
			  <span className="font-medium">{item.label}</span>
			</button>
		  ))}
		</nav>

		<div className="p-4 border-t border-gray-800">
		  <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl mb-3">
			<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
			  {currentUser?.name?.charAt(0).toUpperCase()}
			</div>
			<div className="flex-1">
			  <p className="text-white text-sm font-medium">{currentUser?.name}</p>
			  <p className="text-gray-500 text-xs">Admin</p>
			</div>
		  </div>
		  <button
			onClick={() => setIsAuthenticated(false)}
			className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
		  >
			<LogOut className="w-5 h-5" />
			<span className="font-medium">Çıkış Yap</span>
		  </button>
		</div>
	  </div>
	);
  };

  // Mobile Header
  const MobileHeader = () => (
	<div className="md:hidden bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-50">
	  <div className="flex items-center justify-between">
		<div className="flex items-center gap-3">
		  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
			<Settings className="w-4 h-4 text-white" />
		  </div>
		  <h2 className="text-white font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>TeknikCRM</h2>
		</div>
		<button
		  onClick={() => setIsAuthenticated(false)}
		  className="p-2 text-gray-400 hover:text-white"
		>
		  <LogOut className="w-5 h-5" />
		</button>
	  </div>
	</div>
  );

  // Mobile Navigation
  const MobileNav = () => {
	const menuItems = [
	  { id: 'dashboard', icon: Home },
	  { id: 'tickets', icon: Package },
	  { id: 'shelves', icon: Archive },
	  { id: 'customers', icon: Users },
	  { id: 'settings', icon: Settings },
	];

	return (
	  <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
		<div className="flex justify-around p-2">
		  {menuItems.map((item) => (
			<button
			  key={item.id}
			  onClick={() => setCurrentPage(item.id)}
			  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
				currentPage === item.id
				  ? 'text-blue-500'
				  : 'text-gray-500'
			  }`}
			>
			  <item.icon className="w-5 h-5" />
			</button>
		  ))}
		</div>
	  </div>
	);
  };

  // Dashboard
  const Dashboard = () => (
	<div className="space-y-6">
	  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div>
		  <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Dashboard</h1>
		  <p className="text-gray-400">Teknik servis genel görünüm</p>
		</div>
		<button
		  onClick={() => setShowNewTicketModal(true)}
		  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
		>
		  <Plus className="w-5 h-5" />
		  Yeni Ticket
		</button>
	  </div>

	  {/* Stats Grid */}
	  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all group">
		  <div className="flex items-start justify-between mb-4">
			<div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
			  <Package className="w-6 h-6 text-blue-500" />
			</div>
			<span className="text-2xl">📦</span>
		  </div>
		  <p className="text-gray-400 text-sm mb-1">Toplam Ticket</p>
		  <p className="text-3xl font-bold text-white">{stats.total}</p>
		</div>

		<div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:border-yellow-500/50 transition-all group">
		  <div className="flex items-start justify-between mb-4">
			<div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
			  <Clock className="w-6 h-6 text-yellow-500" />
			</div>
			<span className="text-2xl">⏰</span>
		  </div>
		  <p className="text-gray-400 text-sm mb-1">Beklemede</p>
		  <p className="text-3xl font-bold text-white">{stats.pending}</p>
		</div>

		<div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:border-indigo-500/50 transition-all group">
		  <div className="flex items-start justify-between mb-4">
			<div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
			  <Settings className="w-6 h-6 text-indigo-500" />
			</div>
			<span className="text-2xl">⚙️</span>
		  </div>
		  <p className="text-gray-400 text-sm mb-1">İşlemde</p>
		  <p className="text-3xl font-bold text-white">{stats.inProgress}</p>
		</div>

		<div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:border-green-500/50 transition-all group">
		  <div className="flex items-start justify-between mb-4">
			<div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
			  <Check className="w-6 h-6 text-green-500" />
			</div>
			<span className="text-2xl">✅</span>
		  </div>
		  <p className="text-gray-400 text-sm mb-1">Tamamlandı</p>
		  <p className="text-3xl font-bold text-white">{stats.completed}</p>
		</div>
	  </div>

	  {/* Recent Tickets */}
	  <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
		<div className="flex items-center justify-between mb-6">
		  <h2 className="text-xl font-bold text-white">Son Ticketlar</h2>
		  <button
			onClick={() => setCurrentPage('tickets')}
			className="text-blue-500 hover:text-blue-400 text-sm font-medium flex items-center gap-1"
		  >
			Tümünü Gör <ChevronRight className="w-4 h-4" />
		  </button>
		</div>

		<div className="space-y-3">
		  {tickets.slice(0, 5).map((ticket) => {
			const StatusIcon = statusConfig[ticket.status].icon;
			return (
			  <div
				key={ticket.id}
				onClick={() => {
				  setSelectedTicket(ticket);
				  setCurrentPage('ticket-detail');
				}}
				className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-blue-500/50 cursor-pointer transition-all group"
			  >
				<div className={`w-10 h-10 ${statusConfig[ticket.status].color} rounded-lg flex items-center justify-center`}>
				  <StatusIcon className="w-5 h-5 text-white" />
				</div>
				<div className="flex-1 min-w-0">
				  <p className="text-white font-medium truncate">{ticket.customerName}</p>
				  <p className="text-gray-400 text-sm truncate">{ticket.device}</p>
				</div>
				<div className="text-right">
				  <p className="text-gray-400 text-xs">{ticket.id}</p>
				  <p className={`text-xs font-medium ${priorityConfig[ticket.priority].color}`}>
					{priorityConfig[ticket.priority].label}
				  </p>
				</div>
				<ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
			  </div>
			);
		  })}
		</div>
	  </div>
	</div>
  );

  // Tickets List
  const TicketsList = () => {
	const filteredTickets = tickets.filter(ticket => {
	  const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
	  const matchesSearch = ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
						   ticket.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
						   ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
	  return matchesStatus && matchesSearch;
	});

	return (
	  <div className="space-y-6">
		<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		  <div>
			<h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Ticketlar</h1>
			<p className="text-gray-400">{filteredTickets.length} ticket bulundu</p>
		  </div>
		  <button
			onClick={() => setShowNewTicketModal(true)}
			className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
		  >
			<Plus className="w-5 h-5" />
			Yeni Ticket
		  </button>
		</div>

		{/* Filters */}
		<div className="flex flex-col md:flex-row gap-4">
		  <div className="flex-1 relative">
			<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
			<input
			  type="text"
			  value={searchQuery}
			  onChange={(e) => setSearchQuery(e.target.value)}
			  placeholder="Müşteri, cihaz veya ticket numarası ara..."
			  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			/>
		  </div>
		  <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
			<button
			  onClick={() => setFilterStatus('all')}
			  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
				filterStatus === 'all'
				  ? 'bg-blue-500 text-white'
				  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
			  }`}
			>
			  Tümü ({tickets.length})
			</button>
			{Object.entries(statusConfig).map(([status, config]) => (
			  <button
				key={status}
				onClick={() => setFilterStatus(status)}
				className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
				  filterStatus === status
					? 'bg-blue-500 text-white'
					: 'bg-gray-800 text-gray-400 hover:bg-gray-700'
				}`}
			  >
				{config.label} ({tickets.filter(t => t.status === status).length})
			  </button>
			))}
		  </div>
		</div>

		{/* Tickets Grid */}
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
		  {filteredTickets.map((ticket) => {
			const StatusIcon = statusConfig[ticket.status].icon;
			return (
			  <div
				key={ticket.id}
				onClick={() => {
				  setSelectedTicket(ticket);
				  setCurrentPage('ticket-detail');
				}}
				className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-blue-500/50 cursor-pointer transition-all group"
			  >
				<div className="flex items-start justify-between mb-4">
				  <div className="flex items-center gap-3">
					<div className={`w-12 h-12 ${statusConfig[ticket.status].color} rounded-xl flex items-center justify-center`}>
					  <StatusIcon className="w-6 h-6 text-white" />
					</div>
					<div>
					  <p className="text-white font-bold">{ticket.id}</p>
					  <p className={`text-xs font-medium ${priorityConfig[ticket.priority].color}`}>
						{priorityConfig[ticket.priority].label} Öncelik
					  </p>
					</div>
				  </div>
				  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
				</div>

				<div className="space-y-3">
				  <div>
					<p className="text-gray-400 text-xs mb-1">Müşteri</p>
					<p className="text-white font-medium">{ticket.customerName}</p>
					<p className="text-gray-500 text-sm">{ticket.customerPhone}</p>
				  </div>

				  <div>
					<p className="text-gray-400 text-xs mb-1">Cihaz & Arıza</p>
					<p className="text-white font-medium">{ticket.device}</p>
					<p className="text-gray-500 text-sm">{ticket.issue}</p>
				  </div>

				  <div className="flex items-center justify-between pt-3 border-t border-gray-700">
					<div className="flex items-center gap-2 text-gray-400 text-sm">
					  <Archive className="w-4 h-4" />
					  <span>{ticket.shelfLocation}</span>
					</div>
					<div className="text-blue-500 font-bold">
					  ₺{ticket.estimatedCost}
					</div>
				  </div>
				</div>
			  </div>
			);
		  })}
		</div>
	  </div>
	);
  };

  // Ticket Detail
  const TicketDetail = () => {
	if (!selectedTicket) return null;

	const handlePrintTicket = () => {
	  window.print();
	};

	const handleSendWhatsApp = () => {
	  setShowWhatsAppModal(true);
	};

	const handleEditTicket = () => {
	  setShowEditTicketModal(true);
	};

	return (
	  <div className="space-y-6">
		<div className="flex items-center gap-4">
		  <button
			onClick={() => setCurrentPage('tickets')}
			className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
		  >
			<ChevronRight className="w-5 h-5 rotate-180" />
		  </button>
		  <div className="flex-1">
			<h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
			  {selectedTicket.id}
			</h1>
			<p className="text-gray-400">Ticket Detayları</p>
		  </div>
		  <div className="flex gap-2">
			<button
			  onClick={handleEditTicket}
			  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all"
			>
			  <Edit2 className="w-4 h-4" />
			  <span className="hidden md:inline">Düzenle</span>
			</button>
			<button
			  onClick={handleSendWhatsApp}
			  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all"
			>
			  <Send className="w-4 h-4" />
			  <span className="hidden md:inline">WhatsApp</span>
			</button>
			<button
			  onClick={handlePrintTicket}
			  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all"
			>
			  <Printer className="w-4 h-4" />
			  <span className="hidden md:inline">Yazdır</span>
			</button>
		  </div>
		</div>

		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
		  {/* Main Info */}
		  <div className="lg:col-span-2 space-y-6">
			<div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
			  <h2 className="text-xl font-bold text-white mb-4">Genel Bilgiler</h2>
			  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
				  <p className="text-gray-400 text-sm mb-2">Müşteri Adı</p>
				  <p className="text-white font-medium">{selectedTicket.customerName}</p>
				</div>
				<div>
				  <p className="text-gray-400 text-sm mb-2">Telefon</p>
				  <p className="text-white font-medium">{selectedTicket.customerPhone}</p>
				</div>
				<div>
				  <p className="text-gray-400 text-sm mb-2">Cihaz</p>
				  <p className="text-white font-medium">{selectedTicket.device}</p>
				</div>
				<div>
				  <p className="text-gray-400 text-sm mb-2">Arıza</p>
				  <p className="text-white font-medium">{selectedTicket.issue}</p>
				</div>
				<div>
				  <p className="text-gray-400 text-sm mb-2">Teknisyen</p>
				  <p className="text-white font-medium">{selectedTicket.technician}</p>
				</div>
				<div>
				  <p className="text-gray-400 text-sm mb-2">Raf Konumu</p>
				  <div className="flex items-center gap-2">
					<Archive className="w-4 h-4 text-blue-500" />
					<p className="text-white font-medium">{selectedTicket.shelfLocation}</p>
				  </div>
				</div>
			  </div>
			</div>

			<div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
			  <h2 className="text-xl font-bold text-white mb-4">Notlar</h2>
			  <p className="text-gray-300">{selectedTicket.notes}</p>
			</div>

			<div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
			  <h2 className="text-xl font-bold text-white mb-4">Durum Güncelle</h2>
			  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				{Object.entries(statusConfig).map(([status, config]) => {
				  const StatusIcon = config.icon;
				  return (
					<button
					  key={status}
					  onClick={() => {
						setTickets(tickets.map(t =>
						  t.id === selectedTicket.id ? { ...t, status } : t
						));
						setSelectedTicket({ ...selectedTicket, status });
					  }}
					  className={`p-4 rounded-xl border-2 transition-all ${
						selectedTicket.status === status
						  ? `${config.color} border-white text-white`
						  : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
					  }`}
					>
					  <StatusIcon className="w-6 h-6 mx-auto mb-2" />
					  <p className="text-xs font-medium text-center">{config.label}</p>
					</button>
				  );
				})}
			  </div>
			</div>
		  </div>

		  {/* Sidebar */}
		  <div className="space-y-6">
			<div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
			  <p className="text-sm opacity-90 mb-2">Tahmini Maliyet</p>
			  <p className="text-4xl font-bold mb-4">₺{selectedTicket.estimatedCost}</p>
			  <div className="flex items-center gap-2 text-sm opacity-90">
				<Calendar className="w-4 h-4" />
				<span>{new Date(selectedTicket.createdAt).toLocaleDateString('tr-TR')}</span>
			  </div>
			</div>

			<div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
			  <h3 className="text-lg font-bold text-white mb-4">Durum</h3>
			  <div className={`flex items-center gap-3 p-3 ${statusConfig[selectedTicket.status].color} rounded-xl`}>
				{React.createElement(statusConfig[selectedTicket.status].icon, { className: "w-5 h-5 text-white" })}
				<span className="text-white font-medium">{statusConfig[selectedTicket.status].label}</span>
			  </div>
			</div>

			<div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
			  <h3 className="text-lg font-bold text-white mb-4">Öncelik</h3>
			  <div className="flex gap-2">
				{Object.entries(priorityConfig).map(([priority, config]) => (
				  <button
					key={priority}
					onClick={() => {
					  setTickets(tickets.map(t =>
						t.id === selectedTicket.id ? { ...t, priority } : t
					  ));
					  setSelectedTicket({ ...selectedTicket, priority });
					}}
					className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
					  selectedTicket.priority === priority
						? 'bg-blue-500 text-white'
						: 'bg-gray-900 text-gray-400 hover:bg-gray-700'
					}`}
				  >
					{config.label}
				  </button>
				))}
			  </div>
			</div>
		  </div>
		</div>
	  </div>
	);
  };

  // Shelf System
  const ShelfSystem = () => {
	const [selectedShelf, setSelectedShelf] = useState('A');
	
	const shelfTickets = tickets.filter(t => 
	  t.shelfLocation.startsWith(selectedShelf)
	);

	return (
	  <div className="space-y-6">
		<div>
		  <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Raf Sistemi</h1>
		  <p className="text-gray-400">Cihaz konum takibi</p>
		</div>

		<div className="flex gap-3 overflow-x-auto pb-2">
		  {shelves.map((shelf) => {
			const count = tickets.filter(t => t.shelfLocation.startsWith(shelf.id)).length;
			return (
			  <button
				key={shelf.id}
				onClick={() => setSelectedShelf(shelf.id)}
				className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all whitespace-nowrap ${
				  selectedShelf === shelf.id
					? `${shelf.color} text-white shadow-lg scale-105`
					: 'bg-gray-800 text-gray-400 hover:bg-gray-700'
				}`}
			  >
				<Archive className="w-5 h-5" />
				<div className="text-left">
				  <p className="font-bold text-lg">Raf {shelf.id}</p>
				  <p className="text-xs opacity-75">{count} cihaz</p>
				</div>
			  </button>
			);
		  })}
		</div>

		<div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
		  <div className="flex items-center justify-between mb-6">
			<h2 className="text-xl font-bold text-white">Raf {selectedShelf} - Cihazlar</h2>
			<span className="px-4 py-2 bg-gray-900 rounded-lg text-gray-400 text-sm">
			  {shelfTickets.length} cihaz
			</span>
		  </div>

		  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{shelfTickets.map((ticket) => (
			  <div
				key={ticket.id}
				onClick={() => {
				  setSelectedTicket(ticket);
				  setCurrentPage('ticket-detail');
				}}
				className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 hover:border-blue-500/50 cursor-pointer transition-all group"
			  >
				<div className="flex items-start justify-between mb-3">
				  <div className={`w-10 h-10 ${statusConfig[ticket.status].color} rounded-lg flex items-center justify-center`}>
					{React.createElement(statusConfig[ticket.status].icon, { className: "w-5 h-5 text-white" })}
				  </div>
				  <span className="text-xs text-gray-400">{ticket.id}</span>
				</div>
				<p className="text-white font-medium mb-1">{ticket.customerName}</p>
				<p className="text-gray-400 text-sm mb-2">{ticket.device}</p>
				<div className="flex items-center justify-between pt-3 border-t border-gray-700">
				  <div className="flex items-center gap-2 text-blue-500 text-sm font-medium">
					<MapPin className="w-4 h-4" />
					<span>{ticket.shelfLocation}</span>
				  </div>
				  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-500 transition-colors" />
				</div>
			  </div>
			))}
		  </div>

		  {shelfTickets.length === 0 && (
			<div className="text-center py-12">
			  <Archive className="w-16 h-16 text-gray-700 mx-auto mb-4" />
			  <p className="text-gray-400">Bu rafta cihaz bulunmuyor</p>
			</div>
		  )}
		</div>
	  </div>
	);
  };

  // Customers Page
  const CustomersPage = () => {
	const [customerSearchQuery, setCustomerSearchQuery] = useState('');
	
	const filteredCustomers = customers.filter(customer =>
	  customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
	  customer.phone.includes(customerSearchQuery) ||
	  customer.email.toLowerCase().includes(customerSearchQuery.toLowerCase())
	);

	return (
	  <div className="space-y-6">
		<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		  <div>
			<h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Müşteriler</h1>
			<p className="text-gray-400">{filteredCustomers.length} müşteri bulundu</p>
		  </div>
		  <button
			onClick={() => setShowNewCustomerModal(true)}
			className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
		  >
			<Plus className="w-5 h-5" />
			Yeni Müşteri
		  </button>
		</div>

		{/* Search */}
		<div className="relative">
		  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
		  <input
			type="text"
			value={customerSearchQuery}
			onChange={(e) => setCustomerSearchQuery(e.target.value)}
			placeholder="Müşteri adı, telefon veya email ara..."
			className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
		  />
		</div>

		{/* Customer Stats */}
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
		  <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6">
			<div className="flex items-center gap-3 mb-3">
			  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
				<Users className="w-6 h-6 text-blue-500" />
			  </div>
			  <div>
				<p className="text-gray-400 text-sm">Toplam Müşteri</p>
				<p className="text-2xl font-bold text-white">{customers.length}</p>
			  </div>
			</div>
		  </div>

		  <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6">
			<div className="flex items-center gap-3 mb-3">
			  <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
				<Package className="w-6 h-6 text-indigo-500" />
			  </div>
			  <div>
				<p className="text-gray-400 text-sm">Toplam İş</p>
				<p className="text-2xl font-bold text-white">{customers.reduce((sum, c) => sum + c.totalTickets, 0)}</p>
			  </div>
			</div>
		  </div>

		  <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6">
			<div className="flex items-center gap-3 mb-3">
			  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
				<DollarSign className="w-6 h-6 text-green-500" />
			  </div>
			  <div>
				<p className="text-gray-400 text-sm">Toplam Gelir</p>
				<p className="text-2xl font-bold text-white">₺{customers.reduce((sum, c) => sum + c.totalSpent, 0)}</p>
			  </div>
			</div>
		  </div>
		</div>

		{/* Customers Grid */}
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		  {filteredCustomers.map((customer) => (
			<div
			  key={customer.id}
			  onClick={() => {
				setSelectedCustomer(customer);
			  }}
			  className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-blue-500/50 cursor-pointer transition-all group"
			>
			  <div className="flex items-start justify-between mb-4">
				<div className="flex items-center gap-3">
				  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
					{customer.name.charAt(0).toUpperCase()}
				  </div>
				  <div>
					<p className="text-white font-bold">{customer.name}</p>
					<p className="text-gray-400 text-xs">{customer.id}</p>
				  </div>
				</div>
			  </div>

			  <div className="space-y-2 mb-4">
				<div className="flex items-center gap-2 text-gray-300 text-sm">
				  <Phone className="w-4 h-4 text-gray-500" />
				  <span>{customer.phone}</span>
				</div>
				<div className="flex items-center gap-2 text-gray-300 text-sm">
				  <Mail className="w-4 h-4 text-gray-500" />
				  <span className="truncate">{customer.email}</span>
				</div>
				<div className="flex items-center gap-2 text-gray-300 text-sm">
				  <MapPin className="w-4 h-4 text-gray-500" />
				  <span className="truncate">{customer.address}</span>
				</div>
			  </div>

			  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
				<div className="text-center">
				  <p className="text-gray-400 text-xs mb-1">İş Sayısı</p>
				  <p className="text-white font-bold">{customer.totalTickets}</p>
				</div>
				<div className="text-center">
				  <p className="text-gray-400 text-xs mb-1">Toplam Harcama</p>
				  <p className="text-blue-500 font-bold">₺{customer.totalSpent}</p>
				</div>
			  </div>
			</div>
		  ))}
		</div>
	  </div>
	);
  };

  // Reports Page
  const ReportsPage = () => {
	const monthlyData = [
	  { month: 'Ocak', tickets: 12, revenue: 3400 },
	  { month: 'Şubat', tickets: 8, revenue: 2200 },
	  { month: 'Mart', tickets: 15, revenue: 4800 },
	  { month: 'Nisan', tickets: 10, revenue: 3100 },
	  { month: 'Mayıs', tickets: 18, revenue: 5600 },
	  { month: 'Haziran', tickets: 14, revenue: 4200 },
	];

	const topDevices = [
	  { name: 'Blender', count: 25, percentage: 30 },
	  { name: 'Süpürge', count: 20, percentage: 24 },
	  { name: 'Kettle', count: 18, percentage: 22 },
	  { name: 'Kahve Makinesi', count: 15, percentage: 18 },
	  { name: 'Diğer', count: 5, percentage: 6 },
	];

	return (
	  <div className="space-y-6">
		<div>
		  <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Raporlar</h1>
		  <p className="text-gray-400">Detaylı istatistikler ve analizler</p>
		</div>

		{/* Key Metrics */}
		<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
		  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
			<div className="flex items-center justify-between mb-4">
			  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
				<TrendingUp className="w-6 h-6" />
			  </div>
			  <div className="text-right">
				<p className="text-sm opacity-90">Toplam Gelir</p>
				<p className="text-2xl font-bold">₺{stats.totalRevenue}</p>
			  </div>
			</div>
			<div className="flex items-center gap-2 text-sm opacity-90">
			  <TrendingUp className="w-4 h-4" />
			  <span>+12% bu ay</span>
			</div>
		  </div>

		  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
			<div className="flex items-center justify-between mb-4">
			  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
				<Package className="w-6 h-6" />
			  </div>
			  <div className="text-right">
				<p className="text-sm opacity-90">Ortalama İş Değeri</p>
				<p className="text-2xl font-bold">₺{stats.avgTicketValue}</p>
			  </div>
			</div>
			<div className="flex items-center gap-2 text-sm opacity-90">
			  <Activity className="w-4 h-4" />
			  <span>Sabit</span>
			</div>
		  </div>

		  <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white">
			<div className="flex items-center justify-between mb-4">
			  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
				<Clock className="w-6 h-6" />
			  </div>
			  <div className="text-right">
				<p className="text-sm opacity-90">Bekleyen İşler</p>
				<p className="text-2xl font-bold">{stats.pending + stats.inProgress}</p>
			  </div>
			</div>
			<div className="flex items-center gap-2 text-sm opacity-90">
			  <AlertCircle className="w-4 h-4" />
			  <span>{stats.waitingParts} parça bekliyor</span>
			</div>
		  </div>

		  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
			<div className="flex items-center justify-between mb-4">
			  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
				<Check className="w-6 h-6" />
			  </div>
			  <div className="text-right">
				<p className="text-sm opacity-90">Tamamlanan</p>
				<p className="text-2xl font-bold">{stats.completed}</p>
			  </div>
			</div>
			<div className="flex items-center gap-2 text-sm opacity-90">
			  <TrendingUp className="w-4 h-4" />
			  <span>%{Math.round((stats.completed / stats.total) * 100)} oran</span>
			</div>
		  </div>
		</div>

		{/* Charts */}
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
		  {/* Monthly Performance */}
		  <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
			<h2 className="text-xl font-bold text-white mb-6">Aylık Performans</h2>
			<div className="space-y-4">
			  {monthlyData.map((data, index) => {
				const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));
				const percentage = (data.revenue / maxRevenue) * 100;
				return (
				  <div key={index}>
					<div className="flex items-center justify-between mb-2">
					  <span className="text-gray-400 text-sm">{data.month}</span>
					  <div className="flex items-center gap-4">
						<span className="text-gray-400 text-sm">{data.tickets} iş</span>
						<span className="text-white font-bold">₺{data.revenue}</span>
					  </div>
					</div>
					<div className="w-full bg-gray-700 rounded-full h-2">
					  <div
						className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
						style={{ width: `${percentage}%` }}
					  ></div>
					</div>
				  </div>
				);
			  })}
			</div>
		  </div>

		  {/* Top Devices */}
		  <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
			<h2 className="text-xl font-bold text-white mb-6">En Çok Tamir Edilen Cihazlar</h2>
			<div className="space-y-4">
			  {topDevices.map((device, index) => (
				<div key={index}>
				  <div className="flex items-center justify-between mb-2">
					<span className="text-white font-medium">{device.name}</span>
					<div className="flex items-center gap-2">
					  <span className="text-gray-400 text-sm">{device.count} adet</span>
					  <span className="text-blue-500 font-bold">{device.percentage}%</span>
					</div>
				  </div>
				  <div className="w-full bg-gray-700 rounded-full h-2">
					<div
					  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
					  style={{ width: `${device.percentage}%` }}
					></div>
				  </div>
				</div>
			  ))}
			</div>
		  </div>
		</div>

		{/* Status Distribution */}
		<div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
		  <h2 className="text-xl font-bold text-white mb-6">Durum Dağılımı</h2>
		  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
			{Object.entries(statusConfig).map(([status, config]) => {
			  const StatusIcon = config.icon;
			  const count = tickets.filter(t => t.status === status).length;
			  const percentage = Math.round((count / tickets.length) * 100);
			  return (
				<div key={status} className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
				  <div className="flex items-center gap-3 mb-3">
					<div className={`w-10 h-10 ${config.color} rounded-lg flex items-center justify-center`}>
					  <StatusIcon className="w-5 h-5 text-white" />
					</div>
					<div>
					  <p className="text-white font-bold text-xl">{count}</p>
					  <p className="text-gray-400 text-xs">{percentage}%</p>
					</div>
				  </div>
				  <p className="text-gray-300 text-sm">{config.label}</p>
				</div>
			  );
			})}
		  </div>
		</div>
	  </div>
	);
  };

  // Settings Page
  const SettingsPage = () => {
	const handleSaveSettings = () => {
	  alert('Ayarlar kaydedildi!');
	};

	return (
	  <div className="space-y-6">
		<div>
		  <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Ayarlar</h1>
		  <p className="text-gray-400">Sistem ve kullanıcı ayarları</p>
		</div>

		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
		  {/* Profile Settings */}
		  <div className="lg:col-span-2 space-y-6">
			<div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
			  <h2 className="text-xl font-bold text-white mb-6">Profil Bilgileri</h2>
			  <div className="space-y-4">
				<div>
				  <label className="block text-sm font-medium text-gray-300 mb-2">Kullanıcı Adı</label>
				  <div className="flex items-center gap-3">
					<User className="w-5 h-5 text-gray-500" />
					<input
					  type="text"
					  value={currentUser?.name || ''}
					  onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
					  className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				  </div>
				</div>

				<div>
				  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
				  <div className="flex items-center gap-3">
					<Mail className="w-5 h-5 text-gray-500" />
					<input
					  type="email"
					  placeholder="email@example.com"
					  className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				  </div>
				</div>

				<div>
				  <label className="block text-sm font-medium text-gray-300 mb-2">Telefon</label>
				  <div className="flex items-center gap-3">
					<Phone className="w-5 h-5 text-gray-500" />
					<input
					  type="tel"
					  placeholder="+90 5XX XXX XX XX"
					  className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				  </div>
				</div>
			  </div>
			</div>

			<div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
			  <h2 className="text-xl font-bold text-white mb-6">Bildirim Ayarları</h2>
			  <div className="space-y-4">
				<div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
				  <div className="flex items-center gap-3">
					<Bell className="w-5 h-5 text-blue-500" />
					<div>
					  <p className="text-white font-medium">Bildirimler</p>
					  <p className="text-gray-400 text-sm">Sistem bildirimleri</p>
					</div>
				  </div>
				  <button
					onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
					className={`w-14 h-8 rounded-full transition-all ${
					  settings.notifications ? 'bg-blue-500' : 'bg-gray-700'
					}`}
				  >
					<div className={`w-6 h-6 bg-white rounded-full transition-all ${
					  settings.notifications ? 'ml-7' : 'ml-1'
					}`}></div>
				  </button>
				</div>

				<div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
				  <div className="flex items-center gap-3">
					<Mail className="w-5 h-5 text-indigo-500" />
					<div>
					  <p className="text-white font-medium">Email Bildirimleri</p>
					  <p className="text-gray-400 text-sm">Email ile bildirim al</p>
					</div>
				  </div>
				  <button
					onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
					className={`w-14 h-8 rounded-full transition-all ${
					  settings.emailNotifications ? 'bg-blue-500' : 'bg-gray-700'
					}`}
				  >
					<div className={`w-6 h-6 bg-white rounded-full transition-all ${
					  settings.emailNotifications ? 'ml-7' : 'ml-1'
					}`}></div>
				  </button>
				</div>

				<div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
				  <div className="flex items-center gap-3">
					<Smartphone className="w-5 h-5 text-green-500" />
					<div>
					  <p className="text-white font-medium">WhatsApp Bildirimleri</p>
					  <p className="text-gray-400 text-sm">WhatsApp ile bildirim al</p>
					</div>
				  </div>
				  <button
					onClick={() => setSettings({ ...settings, whatsappNotifications: !settings.whatsappNotifications })}
					className={`w-14 h-8 rounded-full transition-all ${
					  settings.whatsappNotifications ? 'bg-blue-500' : 'bg-gray-700'
					}`}
				  >
					<div className={`w-6 h-6 bg-white rounded-full transition-all ${
					  settings.whatsappNotifications ? 'ml-7' : 'ml-1'
					}`}></div>
				  </button>
				</div>
			  </div>
			</div>

			<div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
			  <h2 className="text-xl font-bold text-white mb-6">Sistem Ayarları</h2>
			  <div className="space-y-4">
				<div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
				  <div className="flex items-center gap-3">
					<Archive className="w-5 h-5 text-cyan-500" />
					<div>
					  <p className="text-white font-medium">Otomatik Yedekleme</p>
					  <p className="text-gray-400 text-sm">Günlük otomatik yedekleme</p>
					</div>
				  </div>
				  <button
					onClick={() => setSettings({ ...settings, autoBackup: !settings.autoBackup })}
					className={`w-14 h-8 rounded-full transition-all ${
					  settings.autoBackup ? 'bg-blue-500' : 'bg-gray-700'
					}`}
				  >
					<div className={`w-6 h-6 bg-white rounded-full transition-all ${
					  settings.autoBackup ? 'ml-7' : 'ml-1'
					}`}></div>
				  </button>
				</div>
			  </div>
			</div>
		  </div>

		  {/* Quick Actions */}
		  <div className="space-y-6">
			<div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
			  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
				<User className="w-6 h-6" />
			  </div>
			  <h3 className="text-lg font-bold mb-2">Profil Tamamlama</h3>
			  <div className="mb-4">
				<div className="flex items-center justify-between text-sm mb-2">
				  <span>%75 tamamlandı</span>
				</div>
				<div className="w-full bg-white/20 rounded-full h-2">
				  <div className="bg-white h-2 rounded-full" style={{ width: '75%' }}></div>
				</div>
			  </div>
			  <p className="text-sm opacity-90">Email ve telefon bilgilerinizi ekleyerek profilinizi tamamlayın</p>
			</div>

			<div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
			  <h3 className="text-lg font-bold text-white mb-4">Güvenlik</h3>
			  <div className="space-y-3">
				<button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-900 hover:bg-gray-800 rounded-xl transition-all text-left">
				  <Lock className="w-5 h-5 text-blue-500" />
				  <div>
					<p className="text-white text-sm font-medium">Şifre Değiştir</p>
					<p className="text-gray-500 text-xs">Güvenliğiniz için düzenli olarak değiştirin</p>
				  </div>
				</button>
			  </div>
			</div>

			<button
			  onClick={handleSaveSettings}
			  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
			>
			  <Save className="w-5 h-5" />
			  Değişiklikleri Kaydet
			</button>
		  </div>
		</div>
	  </div>
	);
  };

  // New Ticket Modal
  const NewTicketModal = () => {
	const [formData, setFormData] = useState({
	  customerName: '',
	  customerPhone: '',
	  customerEmail: '',
	  device: '',
	  issue: '',
	  priority: 'medium',
	  shelfLocation: '',
	  estimatedCost: '',
	  technician: '',
	});

	const handleSubmit = (e) => {
	  e.preventDefault();
	  const newTicket = {
		id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
		...formData,
		status: 'pending',
		createdAt: new Date().toISOString(),
		notes: '',
	  };
	  setTickets([newTicket, ...tickets]);
	  setShowNewTicketModal(false);
	  setFormData({
		customerName: '',
		customerPhone: '',
		customerEmail: '',
		device: '',
		issue: '',
		priority: 'medium',
		shelfLocation: '',
		estimatedCost: '',
		technician: '',
	  });
	};

	return (
	  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
		<div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
		  <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
			<h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
			  Yeni Ticket Oluştur
			</h2>
			<button
			  onClick={() => setShowNewTicketModal(false)}
			  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
			>
			  <X className="w-5 h-5" />
			</button>
		  </div>

		  <form onSubmit={handleSubmit} className="p-6 space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Müşteri Adı *</label>
				<input
				  type="text"
				  required
				  value={formData.customerName}
				  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				  placeholder="Ad Soyad"
				/>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Telefon *</label>
				<input
				  type="tel"
				  required
				  value={formData.customerPhone}
				  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				  placeholder="+90 5XX XXX XX XX"
				/>
			  </div>

			  <div className="md:col-span-2">
				<label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
				<input
				  type="email"
				  value={formData.customerEmail}
				  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				  placeholder="email@example.com"
				/>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Cihaz *</label>
				<input
				  type="text"
				  required
				  value={formData.device}
				  onChange={(e) => setFormData({ ...formData, device: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				  placeholder="Marka Model"
				/>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Arıza *</label>
				<input
				  type="text"
				  required
				  value={formData.issue}
				  onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				  placeholder="Arıza açıklaması"
				/>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Teknisyen *</label>
				<input
				  type="text"
				  required
				  value={formData.technician}
				  onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				  placeholder="Teknisyen adı"
				/>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Raf Konumu *</label>
				<input
				  type="text"
				  required
				  value={formData.shelfLocation}
				  onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				  placeholder="Örn: A-12"
				/>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Tahmini Maliyet (₺) *</label>
				<input
				  type="number"
				  required
				  value={formData.estimatedCost}
				  onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				  placeholder="0"
				/>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Öncelik *</label>
				<select
				  required
				  value={formData.priority}
				  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
				  <option value="low">Düşük</option>
				  <option value="medium">Orta</option>
				  <option value="high">Yüksek</option>
				</select>
			  </div>
			</div>

			<div className="flex gap-3 pt-6 border-t border-gray-700">
			  <button
				type="button"
				onClick={() => setShowNewTicketModal(false)}
				className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
			  >
				İptal
			  </button>
			  <button
				type="submit"
				className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
			  >
				Ticket Oluştur
			  </button>
			</div>
		  </form>
		</div>
	  </div>
	);
  };

  // Edit Ticket Modal
  const EditTicketModal = () => {
	const [formData, setFormData] = useState({
	  ...selectedTicket
	});

	const handleSubmit = (e) => {
	  e.preventDefault();
	  setTickets(tickets.map(t => t.id === selectedTicket.id ? formData : t));
	  setSelectedTicket(formData);
	  setShowEditTicketModal(false);
	};

	return (
	  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
		<div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
		  <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
			<h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
			  Ticket Düzenle - {selectedTicket.id}
			</h2>
			<button
			  onClick={() => setShowEditTicketModal(false)}
			  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
			>
			  <X className="w-5 h-5" />
			</button>
		  </div>

		  <form onSubmit={handleSubmit} className="p-6 space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Müşteri Adı *</label>
				<input
				  type="text"
				  required
				  value={formData.customerName}
				  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Telefon *</label>
				<input
				  type="tel"
				  required
				  value={formData.customerPhone}
				  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			  </div>

			  <div className="md:col-span-2">
				<label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
				<input
				  type="email"
				  value={formData.customerEmail || ''}
				  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Cihaz *</label>
				<input
				  type="text"
				  required
				  value={formData.device}
				  onChange={(e) => setFormData({ ...formData, device: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Arıza *</label>
				<input
				  type="text"
				  required
				  value={formData.issue}
				  onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Teknisyen *</label>
				<input
				  type="text"
				  required
				  value={formData.technician}
				  onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Raf Konumu *</label>
				<input
				  type="text"
				  required
				  value={formData.shelfLocation}
				  onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Tahmini Maliyet (₺) *</label>
				<input
				  type="number"
				  required
				  value={formData.estimatedCost}
				  onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Durum *</label>
				<select
				  required
				  value={formData.status}
				  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
				  {Object.entries(statusConfig).map(([value, config]) => (
					<option key={value} value={value}>{config.label}</option>
				  ))}
				</select>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-300 mb-2">Öncelik *</label>
				<select
				  required
				  value={formData.priority}
				  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
				  <option value="low">Düşük</option>
				  <option value="medium">Orta</option>
				  <option value="high">Yüksek</option>
				</select>
			  </div>

			  <div className="md:col-span-2">
				<label className="block text-sm font-medium text-gray-300 mb-2">Notlar</label>
				<textarea
				  value={formData.notes}
				  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
				  rows={4}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
				  placeholder="Ticket notları..."
				/>
			  </div>
			</div>

			<div className="flex gap-3 pt-6 border-t border-gray-700">
			  <button
				type="button"
				onClick={() => setShowEditTicketModal(false)}
				className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
			  >
				İptal
			  </button>
			  <button
				type="submit"
				className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
			  >
				Değişiklikleri Kaydet
			  </button>
			</div>
		  </form>
		</div>
	  </div>
	);
  };

  // New Customer Modal
  const NewCustomerModal = () => {
	const [formData, setFormData] = useState({
	  name: '',
	  phone: '',
	  email: '',
	  address: '',
	});

	const handleSubmit = (e) => {
	  e.preventDefault();
	  const newCustomer = {
		id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
		...formData,
		totalTickets: 0,
		totalSpent: 0,
	  };
	  setCustomers([...customers, newCustomer]);
	  setShowNewCustomerModal(false);
	  setFormData({ name: '', phone: '', email: '', address: '' });
	};

	return (
	  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
		<div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg">
		  <div className="bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
			<h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
			  Yeni Müşteri Ekle
			</h2>
			<button
			  onClick={() => setShowNewCustomerModal(false)}
			  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
			>
			  <X className="w-5 h-5" />
			</button>
		  </div>

		  <form onSubmit={handleSubmit} className="p-6 space-y-6">
			<div>
			  <label className="block text-sm font-medium text-gray-300 mb-2">Müşteri Adı *</label>
			  <input
				type="text"
				required
				value={formData.name}
				onChange={(e) => setFormData({ ...formData, name: e.target.value })}
				className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				placeholder="Ad Soyad"
			  />
			</div>

			<div>
			  <label className="block text-sm font-medium text-gray-300 mb-2">Telefon *</label>
			  <input
				type="tel"
				required
				value={formData.phone}
				onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
				className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				placeholder="+90 5XX XXX XX XX"
			  />
			</div>

			<div>
			  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
			  <input
				type="email"
				value={formData.email}
				onChange={(e) => setFormData({ ...formData, email: e.target.value })}
				className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				placeholder="email@example.com"
			  />
			</div>

			<div>
			  <label className="block text-sm font-medium text-gray-300 mb-2">Adres</label>
			  <textarea
				value={formData.address}
				onChange={(e) => setFormData({ ...formData, address: e.target.value })}
				rows={3}
				className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
				placeholder="Adres bilgisi"
			  />
			</div>

			<div className="flex gap-3 pt-6 border-t border-gray-700">
			  <button
				type="button"
				onClick={() => setShowNewCustomerModal(false)}
				className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
			  >
				İptal
			  </button>
			  <button
				type="submit"
				className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
			  >
				Müşteri Ekle
			  </button>
			</div>
		  </form>
		</div>
	  </div>
	);
  };

  // WhatsApp Modal
  const WhatsAppModal = () => {
	const [messageType, setMessageType] = useState('in-progress');
	const [customMessage, setCustomMessage] = useState('');

	const templates = {
	  'in-progress': `Sayın ${selectedTicket?.customerName},\n\n${selectedTicket?.device} cihazınız tamir aşamasındadır. En kısa sürede bilgilendirme yapılacaktır.\n\nTeşekkürler.`,
	  'completed': `Sayın ${selectedTicket?.customerName},\n\n${selectedTicket?.device} cihazınızın tamiri tamamlanmıştır. Gelip alabilirsiniz.\n\nToplam Tutar: ₺${selectedTicket?.estimatedCost}\n\nTeşekkürler.`,
	  'waiting-parts': `Sayın ${selectedTicket?.customerName},\n\n${selectedTicket?.device} cihazınız için yedek parça beklenilmektedir. Parça geldikten sonra tamir işlemine başlanacaktır.\n\nTeşekkürler.`,
	  'custom': customMessage,
	};

	const handleSend = () => {
	  const message = templates[messageType];
	  const phone = selectedTicket?.customerPhone.replace(/\s/g, '');
	  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
	  window.open(whatsappUrl, '_blank');
	  setShowWhatsAppModal(false);
	};

	return (
	  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
		<div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg">
		  <div className="bg-green-600 p-6 rounded-t-2xl flex items-center justify-between">
			<div className="flex items-center gap-3">
			  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
				<Send className="w-6 h-6 text-green-600" />
			  </div>
			  <div>
				<h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
				  WhatsApp Mesajı
				</h2>
				<p className="text-green-100 text-sm">{selectedTicket?.customerName}</p>
			  </div>
			</div>
			<button
			  onClick={() => setShowWhatsAppModal(false)}
			  className="p-2 text-white hover:bg-green-700 rounded-lg transition-all"
			>
			  <X className="w-5 h-5" />
			</button>
		  </div>

		  <div className="p-6 space-y-6">
			<div>
			  <label className="block text-sm font-medium text-gray-300 mb-3">Mesaj Şablonu</label>
			  <div className="space-y-2">
				<button
				  onClick={() => setMessageType('in-progress')}
				  className={`w-full text-left p-4 rounded-xl transition-all ${
					messageType === 'in-progress'
					  ? 'bg-blue-500/20 border-2 border-blue-500 text-white'
					  : 'bg-gray-900 border-2 border-gray-700 text-gray-400 hover:border-gray-600'
				  }`}
				>
				  <p className="font-medium">Tamir Aşamasında</p>
				  <p className="text-xs opacity-75 mt-1">Cihazın tamir edildiğini bildir</p>
				</button>

				<button
				  onClick={() => setMessageType('completed')}
				  className={`w-full text-left p-4 rounded-xl transition-all ${
					messageType === 'completed'
					  ? 'bg-blue-500/20 border-2 border-blue-500 text-white'
					  : 'bg-gray-900 border-2 border-gray-700 text-gray-400 hover:border-gray-600'
				  }`}
				>
				  <p className="font-medium">Tamir Tamamlandı</p>
				  <p className="text-xs opacity-75 mt-1">Cihazın hazır olduğunu bildir</p>
				</button>

				<button
				  onClick={() => setMessageType('waiting-parts')}
				  className={`w-full text-left p-4 rounded-xl transition-all ${
					messageType === 'waiting-parts'
					  ? 'bg-blue-500/20 border-2 border-blue-500 text-white'
					  : 'bg-gray-900 border-2 border-gray-700 text-gray-400 hover:border-gray-600'
				  }`}
				>
				  <p className="font-medium">Parça Bekleniyor</p>
				  <p className="text-xs opacity-75 mt-1">Yedek parça beklendiğini bildir</p>
				</button>

				<button
				  onClick={() => setMessageType('custom')}
				  className={`w-full text-left p-4 rounded-xl transition-all ${
					messageType === 'custom'
					  ? 'bg-blue-500/20 border-2 border-blue-500 text-white'
					  : 'bg-gray-900 border-2 border-gray-700 text-gray-400 hover:border-gray-600'
				  }`}
				>
				  <p className="font-medium">Özel Mesaj</p>
				  <p className="text-xs opacity-75 mt-1">Kendi mesajınızı yazın</p>
				</button>
			  </div>
			</div>

			<div>
			  <label className="block text-sm font-medium text-gray-300 mb-2">Mesaj Önizleme</label>
			  {messageType === 'custom' ? (
				<textarea
				  value={customMessage}
				  onChange={(e) => setCustomMessage(e.target.value)}
				  rows={6}
				  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
				  placeholder="Mesajınızı buraya yazın..."
				/>
			  ) : (
				<div className="p-4 bg-gray-900 border border-gray-700 rounded-xl text-gray-300 whitespace-pre-wrap">
				  {templates[messageType]}
				</div>
			  )}
			</div>

			<div className="flex gap-3">
			  <button
				onClick={() => setShowWhatsAppModal(false)}
				className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
			  >
				İptal
			  </button>
			  <button
				onClick={handleSend}
				className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
			  >
				<Send className="w-5 h-5" />
				WhatsApp'ta Aç
			  </button>
			</div>
		  </div>
		</div>
	  </div>
	);
  };

  // Main render
  if (!isAuthenticated) {
	return <LoginPage />;
  }

  return (
	<div className="min-h-screen bg-gray-950">
	  <style>{`
		@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
		
		* {
		  margin: 0;
		  padding: 0;
		  box-sizing: border-box;
		}
		
		body {
		  font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
		  -webkit-font-smoothing: antialiased;
		  -moz-osx-font-smoothing: grayscale;
		}
		
		.print-hide {
		  @media print {
			display: none !important;
		  }
		}
	  `}</style>

	  <div className="flex">
		<Sidebar />
		
		<div className="flex-1 flex flex-col min-h-screen">
		  <MobileHeader />
		  
		  <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
			{currentPage === 'dashboard' && <Dashboard />}
			{currentPage === 'tickets' && <TicketsList />}
			{currentPage === 'ticket-detail' && <TicketDetail />}
			{currentPage === 'shelves' && <ShelfSystem />}
			{currentPage === 'customers' && <CustomersPage />}
			{currentPage === 'reports' && <ReportsPage />}
			{currentPage === 'settings' && <SettingsPage />}
		  </main>

		  <MobileNav />
		</div>
	  </div>

	  {showNewTicketModal && <NewTicketModal />}
	  {showEditTicketModal && <EditTicketModal />}
	  {showNewCustomerModal && <NewCustomerModal />}
	  {showWhatsAppModal && <WhatsAppModal />}
	</div>
  );
};

export default App;